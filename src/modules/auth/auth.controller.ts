import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post("forgot-password")
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Post("reset-password")
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  @Post("refresh")
  refresh(@Body() payload: RefreshTokenDto) {
    return this.authService.refresh(payload.refreshToken);
  }

  @Post("logout")
  logout(@Body() payload: RefreshTokenDto) {
    return this.authService.logout(payload.refreshToken);
  }

  @Get("social/:provider")
  async socialLogin(
    @Param("provider") provider: string,
    @Query("next") nextPath: string | undefined,
    @Res() response: { redirect: (url: string) => void },
  ) {
    try {
      const url = await this.authService.socialLogin(provider, nextPath);
      return response.redirect(url);
    } catch (error) {
      return response.redirect(
        this.authService.socialLoginErrorRedirect(error, nextPath),
      );
    }
  }

  @Get("social/:provider/callback")
  async socialCallback(
    @Param("provider") provider: string,
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Res() response: { redirect: (url: string) => void },
  ) {
    try {
      const url = await this.authService.socialCallback({
        provider,
        code,
        state,
        error,
        errorDescription,
      });

      return response.redirect(url);
    } catch (callbackError) {
      return response.redirect(
        this.authService.socialLoginErrorRedirect(callbackError),
      );
    }
  }
}
