export const getAvatarInitial = (user?: { name?: string | null; avatar?: string | null } | null) => {
  const avatar = user?.avatar?.trim();
  if (avatar && avatar.length <= 3 && !avatar.startsWith("http")) {
    return avatar.charAt(0).toUpperCase();
  }

  const name = user?.name?.trim();
  return (name?.charAt(0) || "U").toUpperCase();
};
