import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { WalletService } from "../wallet/wallet.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
}

type OAuthProvider = "google" | "facebook";

interface OAuthStateRecord {
  provider: OAuthProvider;
  nextPath?: string;
  createdAt: number;
}

interface OAuthSessionRecord {
  accessToken: string;
  refreshToken: string;
  token: string;
  expiresIn: string;
  user: unknown;
  nextPath?: string;
  createdAt: number;
}

interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly walletService: WalletService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly accessTokenTtl = "15m";
  private readonly refreshTokenTtl = "7d";
  private readonly accessTokenSecret =
    process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me";
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me";
  private readonly oauthStateTtlSeconds = 10 * 60;
  private readonly oauthSessionTtlSeconds = 2 * 60;
  private readonly oauthFetchTimeoutMs = 12_000;
  private readonly passwordResetTtlMinutes = 30;
  private readonly oauthStates = new Map<string, OAuthStateRecord>();
  private readonly oauthSessions = new Map<string, OAuthSessionRecord>();

  private assertOAuthProvider(provider: string): OAuthProvider {
    if (provider === "google" || provider === "facebook") {
      return provider;
    }

    throw new BadRequestException("Unsupported social login provider");
  }

  private getFrontendUrl() {
    return (
      process.env.FRONTEND_URL?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000"
    );
  }

  private getBackendApiUrl() {
    return (
      process.env.BACKEND_API_URL?.replace(/\/$/, "") ??
      process.env.API_BASE_URL?.replace(/\/$/, "") ??
      "http://127.0.0.1:4000/api"
    );
  }

  private sanitizeNextPath(nextPath?: string) {
    if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
      return undefined;
    }

    return nextPath;
  }

  private shouldExposeResetLink() {
    return (
      process.env.NODE_ENV !== "production" ||
      process.env.PASSWORD_RESET_EXPOSE_LINK === "true"
    );
  }

  private buildPasswordResetLink(email: string, token: string) {
    const params = new URLSearchParams({
      email,
      token,
    });

    return `${this.getFrontendUrl()}/reset-password?${params.toString()}`;
  }

  private getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
    const prefix = provider.toUpperCase();
    const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
    const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
    const redirectUri =
      process.env[`${prefix}_REDIRECT_URI`]?.trim() ??
      `${this.getBackendApiUrl()}/auth/social/${provider}/callback`;

    if (!clientId || !clientSecret) {
      const label = provider === "google" ? "Google" : "Facebook";
      throw new BadRequestException(
        `${label} login is not configured yet. Add ${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET to the backend environment.`,
      );
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
    };
  }

  private cleanupExpiredOAuthStates() {
    const cutoff = Date.now() - this.oauthStateTtlSeconds * 1000;

    for (const [state, record] of this.oauthStates.entries()) {
      if (record.createdAt < cutoff) {
        this.oauthStates.delete(state);
      }
    }
  }

  private cleanupExpiredOAuthSessions() {
    const cutoff = Date.now() - this.oauthSessionTtlSeconds * 1000;

    for (const [code, record] of this.oauthSessions.entries()) {
      if (record.createdAt < cutoff) {
        this.oauthSessions.delete(code);
      }
    }
  }

  private async createOAuthState(provider: OAuthProvider, nextPath?: string) {
    this.cleanupExpiredOAuthStates();

    const state = randomBytes(24).toString("hex");
    const record: OAuthStateRecord = {
      provider,
      nextPath: this.sanitizeNextPath(nextPath),
      createdAt: Date.now(),
    };

    this.oauthStates.set(state, record);
    await this.redis.setJson(`oauth:state:${state}`, record, this.oauthStateTtlSeconds);

    return state;
  }

  private async consumeOAuthState(state: string, provider: OAuthProvider) {
    const localRecord = this.oauthStates.get(state);
    this.oauthStates.delete(state);

    const redisKey = `oauth:state:${state}`;
    const redisRecord = await this.redis.getJson<OAuthStateRecord>(redisKey);
    await this.redis.delete(redisKey);

    const record = localRecord ?? redisRecord;
    const expired =
      record && Date.now() - record.createdAt > this.oauthStateTtlSeconds * 1000;

    if (!record || expired || record.provider !== provider) {
      throw new BadRequestException("Social login session expired. Please try again.");
    }

    return record;
  }

  private async createOAuthSession(
    authResponse: Awaited<ReturnType<AuthService["buildAuthResponse"]>>,
    nextPath?: string,
  ) {
    this.cleanupExpiredOAuthSessions();

    const code = randomBytes(24).toString("hex");
    const record: OAuthSessionRecord = {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      token: authResponse.token,
      expiresIn: authResponse.expiresIn,
      user: authResponse.user,
      nextPath: this.sanitizeNextPath(nextPath),
      createdAt: Date.now(),
    };

    this.oauthSessions.set(code, record);
    await this.redis.setJson(
      `oauth:session:${code}`,
      record,
      this.oauthSessionTtlSeconds,
    );

    return code;
  }

  async consumeSocialSession(code?: string) {
    if (!code) {
      throw new BadRequestException("Social login session code is missing.");
    }

    const localRecord = this.oauthSessions.get(code);
    this.oauthSessions.delete(code);

    const redisKey = `oauth:session:${code}`;
    const redisRecord = await this.redis.getJson<OAuthSessionRecord>(redisKey);
    await this.redis.delete(redisKey);

    const record = localRecord ?? redisRecord;
    const expired =
      record && Date.now() - record.createdAt > this.oauthSessionTtlSeconds * 1000;

    if (!record || expired) {
      throw new BadRequestException(
        "Social login session expired. Please try again.",
      );
    }

    return {
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      token: record.token,
      expiresIn: record.expiresIn,
      user: record.user,
      next: record.nextPath,
    };
  }

  private buildOAuthErrorRedirect(error: unknown, nextPath?: string) {
    const message =
      typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Social login failed. Please try again.";
    const params = new URLSearchParams({
      oauthError: message,
    });
    const sanitizedNextPath = this.sanitizeNextPath(nextPath);

    if (sanitizedNextPath) {
      params.set("next", sanitizedNextPath);
    }

    return `${this.getFrontendUrl()}/login?${params.toString()}`;
  }

  socialLoginErrorRedirect(error: unknown, nextPath?: string) {
    return this.buildOAuthErrorRedirect(error, nextPath);
  }

  private async buildOAuthSuccessRedirect(
    authResponse: Awaited<ReturnType<AuthService["buildAuthResponse"]>>,
    nextPath?: string,
  ) {
    const oauthCode = await this.createOAuthSession(authResponse, nextPath);
    const params = new URLSearchParams({
      oauthCode,
    });

    return `${this.getFrontendUrl()}/auth/callback?${params.toString()}`;
  }

  private async readProviderJson<T>(response: Response, context: string) {
    const data = (await response.json().catch(() => null)) as
      | (T & { error?: string; error_description?: string; message?: string })
      | null;

    if (!response.ok || !data) {
      const message =
        data?.error_description ??
        data?.message ??
        data?.error ??
        `${context} failed.`;
      throw new BadRequestException(message);
    }

    return data as T;
  }

  private async fetchOAuthProvider(
    url: string | URL,
    init: RequestInit | undefined,
    context: string,
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.oauthFetchTimeoutMs,
    );

    try {
      return await fetch(url, {
        ...(init ?? {}),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new BadRequestException(
          `${context} timed out. Please try social login again.`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchGoogleProfile(
    code: string,
    config: OAuthProviderConfig,
  ): Promise<OAuthProfile> {
    const tokenResponse = await this.fetchOAuthProvider(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
        }),
      },
      "Google token exchange",
    );
    const tokenData = await this.readProviderJson<{ access_token?: string }>(
      tokenResponse,
      "Google token exchange",
    );

    if (!tokenData.access_token) {
      throw new BadRequestException("Google did not return an access token.");
    }

    const profileResponse = await this.fetchOAuthProvider(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
      "Google profile lookup",
    );
    const profile = await this.readProviderJson<{
      sub?: string;
      email?: string;
      name?: string;
    }>(profileResponse, "Google profile lookup");

    if (!profile.sub) {
      throw new BadRequestException("Google did not return a profile id.");
    }

    return {
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
    };
  }

  private async fetchFacebookProfile(
    code: string,
    config: OAuthProviderConfig,
  ): Promise<OAuthProfile> {
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", config.clientId);
    tokenUrl.searchParams.set("client_secret", config.clientSecret);
    tokenUrl.searchParams.set("redirect_uri", config.redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await this.fetchOAuthProvider(
      tokenUrl,
      undefined,
      "Facebook token exchange",
    );
    const tokenData = await this.readProviderJson<{ access_token?: string }>(
      tokenResponse,
      "Facebook token exchange",
    );

    if (!tokenData.access_token) {
      throw new BadRequestException("Facebook did not return an access token.");
    }

    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.searchParams.set("fields", "id,name,email");
    profileUrl.searchParams.set("access_token", tokenData.access_token);

    const profileResponse = await this.fetchOAuthProvider(
      profileUrl,
      undefined,
      "Facebook profile lookup",
    );
    const profile = await this.readProviderJson<{
      id?: string;
      email?: string;
      name?: string;
    }>(profileResponse, "Facebook profile lookup");

    if (!profile.id) {
      throw new BadRequestException("Facebook did not return a profile id.");
    }

    return {
      provider: "facebook",
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
    };
  }

  private async getOrCreateSocialUser(profile: OAuthProfile) {
    const email = profile.email?.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException(
        `${profile.provider === "google" ? "Google" : "Facebook"} did not share an email address. Please allow email access or use email/password login.`,
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status !== "ACTIVE") {
        throw new UnauthorizedException("Account is not active");
      }

      return existing;
    }

    const passwordHash = await bcrypt.hash(
      `${profile.provider}:${profile.providerId}:${randomBytes(24).toString("hex")}`,
      10,
    );
    const user = await this.prisma.user.create({
      data: {
        fullName: profile.name?.trim() || email.split("@")[0],
        email,
        passwordHash,
      },
    });

    await this.walletService.createWallet(user.id);
    await this.redis.delete("admin:dashboard:metrics");

    return user;
  }

  private serializeUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    kycStatus: string;
    kycDocumentType?: string | null;
    kycDocumentUrl?: string | null;
    kycAdminNote?: string | null;
    kycSubmittedAt?: Date | null;
    kycReviewedAt?: Date | null;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
      kycDocumentType: user.kycDocumentType ?? undefined,
      kycDocumentUrl: user.kycDocumentUrl ?? undefined,
      kycAdminNote: user.kycAdminNote ?? undefined,
      kycSubmittedAt: user.kycSubmittedAt?.toISOString(),
      kycReviewedAt: user.kycReviewedAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }

  private buildJwtPayload(user: {
    id: string;
    email: string;
    role: string;
  }): AuthTokenPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    role: string;
  }) {
    const payload = this.buildJwtPayload(user);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        refreshTokenExpiresAt,
      },
    });
  }

  private async buildAuthResponse(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    kycStatus: string;
    kycDocumentType?: string | null;
    kycDocumentUrl?: string | null;
    kycAdminNote?: string | null;
    kycSubmittedAt?: Date | null;
    kycReviewedAt?: Date | null;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.serializeUser(user),
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.accessTokenTtl,
    };
  }

  async register(payload: RegisterDto) {
    const email = payload.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException("Email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: payload.fullName.trim(),
        email,
        passwordHash,
      },
    });

    await this.walletService.createWallet(user.id);
    await this.redis.delete("admin:dashboard:metrics");

    return this.buildAuthResponse(user);
  }

  async login(payload: LoginDto) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }

    return this.buildAuthResponse(user);
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const email = payload.email.trim().toLowerCase();
    const genericResponse: {
      message: string;
      resetLink?: string;
      expiresAt?: string;
    } = {
      message:
        "If an account exists for this email, password reset instructions are ready.",
    };

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== "ACTIVE") {
      return genericResponse;
    }

    const token = randomBytes(32).toString("hex");
    const passwordResetTokenHash = await bcrypt.hash(token, 10);
    const passwordResetExpiresAt = new Date(
      Date.now() + this.passwordResetTtlMinutes * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash,
        passwordResetExpiresAt,
      },
    });

    return {
      ...genericResponse,
      resetLink: this.shouldExposeResetLink()
        ? this.buildPasswordResetLink(email, token)
        : undefined,
      expiresAt: passwordResetExpiresAt.toISOString(),
    };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    const invalidMessage = "Reset link is invalid or expired.";

    if (
      !user ||
      !user.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(invalidMessage);
    }

    const isValidToken = await bcrypt.compare(
      payload.token,
      user.passwordResetTokenHash,
    );

    if (!isValidToken) {
      throw new BadRequestException(invalidMessage);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    return {
      success: true,
      message: "Password updated successfully. You can now log in.",
    };
  }

  async refresh(refreshToken: string) {
    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Session is no longer valid");
    }

    if (
      user.refreshTokenExpiresAt &&
      user.refreshTokenExpiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isValidRefreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.buildAuthResponse(user);
  }

  async logout(refreshToken: string) {
    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  async socialLogin(providerValue: string, nextPath?: string) {
    const provider = this.assertOAuthProvider(providerValue);
    const config = this.getProviderConfig(provider);
    const state = await this.createOAuthState(provider, nextPath);

    if (provider === "google") {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "select_account");
      return url.toString();
    }

    const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email,public_profile");
    url.searchParams.set("state", state);
    return url.toString();
  }

  async socialCallback(payload: {
    provider: string;
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
  }) {
    let provider: OAuthProvider;

    try {
      provider = this.assertOAuthProvider(payload.provider);
    } catch (error) {
      return this.buildOAuthErrorRedirect(error);
    }

    if (payload.error) {
      return this.buildOAuthErrorRedirect(
        payload.errorDescription ?? payload.error,
      );
    }

    if (!payload.code || !payload.state) {
      return this.buildOAuthErrorRedirect(
        "Social login did not return the required verification details.",
      );
    }

    try {
      const state = await this.consumeOAuthState(payload.state, provider);
      const config = this.getProviderConfig(provider);
      const profile =
        provider === "google"
          ? await this.fetchGoogleProfile(payload.code, config)
          : await this.fetchFacebookProfile(payload.code, config);
      const user = await this.getOrCreateSocialUser(profile);
      const authResponse = await this.buildAuthResponse(user);

      return await this.buildOAuthSuccessRedirect(authResponse, state.nextPath);
    } catch (error) {
      return this.buildOAuthErrorRedirect(error);
    }
  }
}
