import { ForbiddenException, NotFoundException } from '@nestjs/common';

// Só o autor mexe no que é dele: 404 se não existe, 403 se é de outra pessoa.
export function assertOwner<T extends { userId: number }>(
  record: T | null,
  userId: number,
  label: string,
): T {
  if (!record) {
    throw new NotFoundException(`${label} not found`);
  }
  if (record.userId !== userId) {
    throw new ForbiddenException(`${label} belongs to another user`);
  }
  return record;
}
