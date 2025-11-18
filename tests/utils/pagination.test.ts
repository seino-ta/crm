import { buildPaginationMeta, normalizePagination } from '../../src/utils/pagination';

describe('pagination utils', () => {
  it('normalizes invalid values to defaults', () => {
    const result = normalizePagination({ page: -1, pageSize: 0 });
    expect(result).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it('caps pageSize at max', () => {
    const result = normalizePagination({ page: 2, pageSize: 1000 });
    expect(result).toEqual({ page: 2, pageSize: 100, skip: 100, take: 100 });
  });

  it('builds pagination meta correctly', () => {
    const meta = buildPaginationMeta(45, 2, 20);
    expect(meta).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
  });
});
