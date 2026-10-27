import { AuthUser } from "@/types/auth";

type UserAvatarProp = {
  user: AuthUser | null;
  className?: string;
};

export default function UserAvatar({
  user,
  className = "h-9 w-9",
}: UserAvatarProp) {
  const name = user?.name || user?.email || "User";
  const initial = name.charAt(0).toUpperCase();

  if (user?.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image_url}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#ead8ca] text-sm font-bold text-[#71442e]`}
    >
      {initial}
    </span>
  );
}
