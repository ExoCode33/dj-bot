import { PermissionFlagsBits } from 'discord.js';
export function isAuthorized(member, roleId) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (roleId && member.roles.cache.has(roleId)) return true;
  return false;
}
