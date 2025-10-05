/**
 * Mock for fs/promises module
 * Provides all fs/promises functions with jest mocks
 */

export const mkdir = jest.fn().mockResolvedValue(undefined);
export const writeFile = jest.fn().mockResolvedValue(undefined);
export const readFile = jest.fn().mockResolvedValue('[]');
export const readdir = jest.fn().mockResolvedValue([]);
export const access = jest.fn().mockResolvedValue(undefined);
export const unlink = jest.fn().mockResolvedValue(undefined);  // FIX: Add unlink
export const stat = jest.fn().mockResolvedValue({ size: 1024 * 1024 } as any);
export const rm = jest.fn().mockResolvedValue(undefined);
export const rmdir = jest.fn().mockResolvedValue(undefined);
export const rename = jest.fn().mockResolvedValue(undefined);
export const copyFile = jest.fn().mockResolvedValue(undefined);
export const readlink = jest.fn().mockResolvedValue('');
export const symlink = jest.fn().mockResolvedValue(undefined);
export const lstat = jest.fn().mockResolvedValue({ isDirectory: () => false } as any);
export const realpath = jest.fn().mockResolvedValue('');
export const mkdtemp = jest.fn().mockResolvedValue('');
export const writeFileSync = jest.fn();
export const readFileSync = jest.fn().mockReturnValue('');

export default {
  mkdir,
  writeFile,
  readFile,
  readdir,
  access,
  unlink,
  stat,
  rm,
  rmdir,
  rename,
  copyFile,
  readlink,
  symlink,
  lstat,
  realpath,
  mkdtemp,
  writeFileSync,
  readFileSync,
};
