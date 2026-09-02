"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { fetchUserProfile, updateUserProfilePicture } from "../lib/admin-backend";
import { adminNavigation, userNavigation } from "../lib/mock-data";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { BonusBalanceAmount } from "./bonus-balance";
import { SearchProvider, useGlobalSearch } from "../lib/search-context";
import { ServiceIcon, type ServiceIconName } from "./service-icon";
import { uploadToCloudinary } from "../lib/upload-service";
import { Icon } from "./icons";

interface AppShellProps {
  children: ReactNode;
  activeSlug: string;
  title?: string;
  subtitle?: string;
  admin?: boolean;
}

interface ShellNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

interface StoredShellUser {
  id?: string;
  fullName?: string;
  profileImageUrl?: string;
  role?: string;
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

const adminNotifications: ShellNotification[] = [
  {
    id: "admin-1",
    title: "3 transactions need review",
    detail: "Pending proofs are waiting for manual confirmation.",
    time: "2 mins ago",
    unread: true,
  },
  {
    id: "admin-2",
    title: "Buy4Me order moved to processing",
    detail: "Ada N.'s iPhone request has entered supplier handling.",
    time: "18 mins ago",
    unread: true,
  },
  {
    id: "admin-3",
    title: "KYC queue updated",
    detail: "One flagged identity needs a second look.",
    time: "1 hour ago",
    unread: true,
  },
];

const userNotifications: ShellNotification[] = [
  {
    id: "user-1",
    title: "Deposit confirmed",
    detail: "Your latest payment has been approved and reflected.",
    time: "4 mins ago",
    unread: true,
  },
  {
    id: "user-2",
    title: "Bonus balance updated",
    detail: "A new referral bonus has been added to your wallet.",
    time: "27 mins ago",
    unread: true,
  },
  {
    id: "user-3",
    title: "Buy4Me quote ready",
    detail: "Your product request now has a pricing breakdown.",
    time: "1 hour ago",
    unread: false,
  },
];

function AdminSearchInput() {
  const { searchQuery, setSearchQuery } = useGlobalSearch();

  return (
    <div className="hidden items-center gap-2 rounded-xl border border-[#e4ebe7] bg-white px-3 py-1.5 text-sm text-slate-600 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 md:flex">
      <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        type="text"
        placeholder="Search anything..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-40 border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 lg:w-56"
      />
    </div>
  );
}

function AppShellInner({ children, activeSlug, title, subtitle, admin = false }: AppShellProps) {
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [isProfileImageSaving, setIsProfileImageSaving] = useState(false);
  const [activeNotification, setActiveNotification] = useState<ShellNotification | null>(null);
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [storedUserName, setStoredUserName] = useState<string | null>(null);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notifications, setNotifications] = useState<ShellNotification[]>(
    admin ? adminNotifications : userNotifications,
  );
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const profileName = storedUserName ?? (admin ? "Admin" : "User");
  const profileInitial = profileName.charAt(0);
  const isOverlayOpen =
    isMobileNavOpen ||
    isNotificationOpen ||
    isProfileOpen ||
    Boolean(activeNotification);

  useBodyScrollLock(isOverlayOpen);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawUser = window.localStorage.getItem("ofe_user");
    if (!rawUser) {
      const next = encodeURIComponent(pathname);
      router.replace(admin ? `/login?admin=1&next=${next}` : `/login?next=${next}`);
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredShellUser;
      const role = parsedUser.role?.trim();
      if (admin && role !== "ADMIN") {
        window.localStorage.removeItem("ofe_user");
        window.localStorage.removeItem("ofe_access_token");
        window.localStorage.removeItem("ofe_refresh_token");
        router.replace(`/login?admin=1&next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (parsedUser.id) {
        setStoredUserId(parsedUser.id);
      }
      setProfileImage(parsedUser.profileImageUrl ?? null);

      const fullName = parsedUser.fullName?.trim();
      if (!fullName) {
        setStoredUserName(admin ? "Admin" : "User");
      } else {
        const firstName = fullName.split(/\s+/)[0];
        if (firstName) {
          setStoredUserName(firstName);
        }
      }

      setIsAuthorized(true);
    } catch {
      window.localStorage.removeItem("ofe_user");
      window.localStorage.removeItem("ofe_access_token");
      window.localStorage.removeItem("ofe_refresh_token");
      const next = encodeURIComponent(pathname);
      router.replace(admin ? `/login?admin=1&next=${next}` : `/login?next=${next}`);
    }
  }, [admin, pathname, router]);

  useEffect(() => {
    if (!storedUserId) {
      return;
    }

    fetchUserProfile(storedUserId)
      .then((profile) => {
        setProfileImage(profile.profileImageUrl ?? null);
        const fullName = profile.fullName?.trim();
        if (fullName) {
          setStoredUserName(fullName.split(/\s+/)[0] ?? fullName);
        }

        const rawUser = window.localStorage.getItem("ofe_user");
        const stored = rawUser ? (JSON.parse(rawUser) as StoredShellUser) : {};
        const profileForStorage = { ...profile };
        delete profileForStorage.profileImageUrl;
        window.localStorage.setItem(
          "ofe_user",
          JSON.stringify({ ...stored, ...profileForStorage }),
        );
      })
      .catch(() => {
        // Keep the locally stored profile data if the backend is temporarily unavailable.
      });
  }, [storedUserId]);

  useEffect(() => {
    if (!storedUserId) {
      return;
    }

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "http://127.0.0.1:4000/api";

    const loadNotifications = () => {
      fetch(`${apiBaseUrl}/notifications?userId=${encodeURIComponent(storedUserId)}`, {
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to load notifications");
          }

          return (await response.json()) as Array<{
            id: string;
            title: string;
            message: string;
            createdAt: string;
            read: boolean;
          }>;
        })
        .then((items) => {
          setNotifications(
            items.map((item) => ({
              id: item.id,
              title: item.title,
              detail: item.message,
              time: new Date(item.createdAt).toLocaleString("en-NG", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
              unread: !item.read,
            })),
          );
        })
        .catch(() => undefined);
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30_000);
    const onFocus = () => loadNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [storedUserId]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ofe_user");
      window.localStorage.removeItem("ofe_access_token");
      window.localStorage.removeItem("ofe_refresh_token");
    }
    router.push(admin ? "/" : "/login");
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8f6] px-4">
        <div className="rounded-[24px] border border-[#e6ece8] bg-white px-6 py-5 text-center shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
          <p className="text-sm font-semibold text-slate-800">
            Checking your access...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Taking you to the right sign-in page.
          </p>
        </div>
      </div>
    );
  }

  const removeStoredProfileImage = () => {
    if (typeof window === "undefined") {
      return;
    }

    const rawUser = window.localStorage.getItem("ofe_user");
    const stored = rawUser ? (JSON.parse(rawUser) as StoredShellUser) : {};
    delete stored.profileImageUrl;
    window.localStorage.setItem("ofe_user", JSON.stringify(stored));
  };

  const handleProfileImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!storedUserId) {
      setProfileFeedback("Please log in again before changing your picture.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileFeedback("Please choose a PNG, JPG, WebP, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileFeedback("Please choose an image below 5MB.");
      return;
    }

    try {
      setIsProfileImageSaving(true);
      setProfileFeedback(null);
      const dataUrl = await readImageAsDataUrl(file);
      let imageUrl = dataUrl;
      try {
        imageUrl = await uploadToCloudinary(dataUrl, "avatars");
      } catch (uploadErr) {
        console.warn("Cloudinary upload fallback:", uploadErr);
      }
      const updatedUser = await updateUserProfilePicture(storedUserId, imageUrl);
      setProfileImage(updatedUser.profileImageUrl ?? null);
      removeStoredProfileImage();
      setProfileFeedback("Profile picture saved.");
    } catch (error) {
      setProfileFeedback(
        error instanceof Error
          ? error.message
          : "Unable to save your profile picture right now.",
      );
    } finally {
      setIsProfileImageSaving(false);
      event.target.value = "";
    }
  };

  const removeProfileImage = async () => {
    if (!storedUserId) {
      setProfileFeedback("Please log in again before changing your picture.");
      return;
    }

    try {
      setIsProfileImageSaving(true);
      setProfileFeedback(null);
      await updateUserProfilePicture(storedUserId, null);
      setProfileImage(null);
      removeStoredProfileImage();
      setProfileFeedback("Profile picture removed.");
    } catch (error) {
      setProfileFeedback(
        error instanceof Error
          ? error.message
          : "Unable to remove your profile picture right now.",
      );
    } finally {
      setIsProfileImageSaving(false);
    }
  };

  const openNotification = (notification: ShellNotification) => {
    setActiveNotification(notification);
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    );
    setIsNotificationOpen(false);

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "http://127.0.0.1:4000/api";

    fetch(`${apiBaseUrl}/notifications/${encodeURIComponent(notification.id)}/read`, {
      method: "PATCH",
    }).catch(() => undefined);
  };

  const brandBlock = (
    <div className="mt-6 flex flex-col gap-2 px-3">
      <Icon name="logo" className="h-6 w-auto" />
      <p className={`text-xs px-1 ${admin ? "text-emerald-300/70" : "text-slate-500"}`}>{admin ? "Admin Panel" : "Bonus Tracker"}</p>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="flex-1 space-y-6">
        {admin ? (
          ["main", "market", "settings"].map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">{group}</p>
              <div className="space-y-1">
                {adminNavigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileNavOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          isActive ? "bg-[#0f7b36] text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon name={item.icon as never} className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {userNavigation.map((item) => {
              const isActive = item.slug === activeSlug;
              const isDashboardItem = item.slug === "dashboard";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive ? "bg-[#0f7b36] text-white" : "text-slate-700 hover:bg-[#edf6ef] hover:text-[#0f7b36]"
                  }`}
                >
                  {isDashboardItem ? (
                    <Icon name={item.icon as never} className="h-4 w-4" />
                  ) : (
                    <ServiceIcon
                      name={item.slug as ServiceIconName}
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {!admin ? (
        <div className="mt-6 rounded-2xl border border-[#e8efea] bg-[#f8fbf8] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 rounded-full bg-emerald-50 p-2 text-emerald-600">
              <Icon name="chat" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Need Help?</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Our support team is ready to assist you.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f7b36]">
                Contact Support
                <Icon name="arrow" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleLogout}
        className={`mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${admin ? "text-white/75 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-[#edf6ef] hover:text-[#0f7b36]"}`}
      >
        <Icon name="lock" className="h-4 w-4" />
        Logout
      </button>

      {brandBlock}
    </>
  );

  return (
    <div className="min-h-screen [overflow-x:clip] bg-[#f6f8f6] text-slate-900">
      <div className="flex min-h-screen w-full [overflow-x:clip]">
        <aside className={`fixed inset-y-0 left-0 z-20 hidden h-screen w-[270px] shrink-0 flex-col overflow-y-auto border-r px-4 py-5 lg:flex ${admin ? "border-[#0d2f1d] bg-[#071811] text-white" : "border-[#ebf0ec] bg-white"}`}>
          {sidebarContent}
        </aside>

        <div className="min-w-0 flex-1 [overflow-x:clip] lg:ml-[270px]">
          <div
            className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-out ${
              isMobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <button
              type="button"
              aria-label="Close navigation overlay"
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute inset-0 bg-slate-950/35"
            />
            <aside
              className={`relative z-10 flex h-full w-[min(290px,calc(100vw-2rem))] flex-col border-r px-4 py-5 shadow-[0_18px_50px_rgba(15,23,32,0.16)] transition-transform duration-300 ease-out ${
                isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
              } ${admin ? "border-[#0d2f1d] bg-[#071811] text-white" : "border-[#ebf0ec] bg-white"}`}
            >
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`rounded-xl border p-2 ${admin ? "border-white/10 text-white/80" : "border-[#d8e3dc] text-slate-600"}`}
                >
                  <Icon name="x" className="h-5 w-5" />
                </button>
              </div>
              {sidebarContent}
            </aside>
          </div>

          <header className="fixed left-0 right-0 top-0 z-30 border-b border-[#ebf0ec] bg-white/90 backdrop-blur-md lg:left-[270px]">
            <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-4 sm:px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={isMobileNavOpen}
                  onClick={() => setIsMobileNavOpen((current) => !current)}
                  className="rounded-xl border border-[#e4ebe7] p-2 text-slate-600 lg:hidden"
                >
                  <Icon name={isMobileNavOpen ? "x" : "menu"} className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  {title ? <h1 className="text-[14px] font-semibold text-slate-900">{title}</h1> : null}
                  {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {admin ? <AdminSearchInput /> : null}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationOpen((current) => !current);
                      setIsProfileOpen(false);
                    }}
                    className="relative rounded-full bg-white p-2 text-slate-600 transition hover:bg-[#f4f7f5]"
                  >
                    <Icon name="bell" className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {isNotificationOpen ? (
                    <>
                      <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setIsNotificationOpen(false)}
                        className="fixed inset-0 z-30 cursor-default bg-transparent"
                      />
                      <div className="fixed left-3 right-3 top-[76px] z-40 max-h-[calc(100dvh-92px)] overflow-y-auto overscroll-contain rounded-[24px] border border-[#e5ebe7] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,32,0.12)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[min(320px,calc(100vw-2rem))]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Notifications</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {admin ? "Admin activity and queue updates." : "Latest account and order updates."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsNotificationOpen(false)}
                            className="rounded-full border border-[#dbe5df] px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
                          >
                            Close
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {notifications.length > 0 ? notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => openNotification(item)}
                              className="block w-full rounded-[18px] border border-[#edf1ee] bg-[#fbfdfb] p-3 text-left transition hover:border-[#dce8e0] hover:bg-white"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                                </div>
                                {item.unread ? (
                                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                                ) : null}
                              </div>
                              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                                {item.time}
                              </p>
                            </button>
                          )) : (
                            <div className="rounded-[18px] border border-[#edf1ee] bg-[#fbfdfb] p-4 text-sm text-slate-500">
                              No new notifications.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen((current) => !current);
                      setIsNotificationOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 transition hover:bg-[#f8fbf8]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#0f7b36] text-sm font-semibold text-white">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={`${profileName} profile`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        profileInitial
                      )}
                    </span>
                    <div className="hidden md:block">
                      <p className="text-xs text-slate-500">Welcome,</p>
                      <p className="text-sm font-semibold text-slate-800">{profileName}</p>
                    </div>
                  </button>

                  {isProfileOpen ? (
                    <>
                      <button
                        type="button"
                        aria-label="Close profile menu"
                        onClick={() => setIsProfileOpen(false)}
                        className="fixed inset-0 z-30 cursor-default bg-transparent"
                      />
                      <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[min(300px,calc(100vw-2rem))] rounded-[24px] border border-[#e5ebe7] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,32,0.12)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Profile</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Upload a new picture for your {admin ? "admin" : "user"} account.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsProfileOpen(false)}
                          className="rounded-full border border-[#dbe5df] px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
                        >
                          Close
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-[#edf1ee] bg-[#fbfdfb] p-3">
                        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#0f7b36] text-lg font-semibold text-white">
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={`${profileName} profile preview`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            profileInitial
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{profileName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            JPG, PNG, or WebP avatar
                          </p>
                        </div>
                      </div>

                      {profileFeedback ? (
                        <p className="mt-3 rounded-2xl bg-[#f6faf7] px-4 py-3 text-xs leading-5 text-slate-600">
                          {profileFeedback}
                        </p>
                      ) : null}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={isProfileImageSaving}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Icon name="upload" className="h-4 w-4" />
                          {isProfileImageSaving ? "Saving..." : "Change picture"}
                        </button>
                        {profileImage ? (
                          <button
                            type="button"
                            disabled={isProfileImageSaving}
                            onClick={() => void removeProfileImage()}
                            className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          {activeNotification ? (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/18 px-3 py-3 backdrop-blur-[2px] sm:items-center sm:px-4"
              onClick={() => setActiveNotification(null)}
            >
              <div
                className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[360px] overflow-y-auto overscroll-contain rounded-[24px] border border-[#e5ebe7] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,32,0.16)] sm:rounded-[26px] sm:p-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Notification
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {activeNotification.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNotification(null)}
                    className="rounded-full border border-[#dbe5df] px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 rounded-[20px] border border-[#edf1ee] bg-[#fbfdfb] p-4">
                  <p className="text-sm leading-6 text-slate-600">{activeNotification.detail}</p>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    {activeNotification.time}
                  </p>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveNotification(null)}
                    className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <main className="w-full overflow-x-hidden px-3 pb-5 pt-[88px] sm:px-4 sm:pt-[92px] md:px-6">
            <div className="mx-auto w-full max-w-[1500px] min-w-0">
              {!admin ? (
                <div className="mb-6 flex flex-col gap-3 rounded-[26px] border border-[#e6ece8] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,32,0.04)] md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bonus Balance</p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                        <Icon name="wallet" className="h-5 w-5" />
                      </span>
                      <p className="min-w-0 text-2xl font-semibold sm:text-3xl">
                        <BonusBalanceAmount />
                      </p>
                      <Icon name="eye" className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Referral and threshold bonuses are added manually after qualifying transactions.
                    </p>
                  </div>
                </div>
              ) : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <SearchProvider>
      <AppShellInner {...props} />
    </SearchProvider>
  );
}
