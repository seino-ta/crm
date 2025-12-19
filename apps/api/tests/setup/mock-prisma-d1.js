jest.mock('@prisma/adapter-d1', () => ({
  PrismaD1: class PrismaD1Mock {
    constructor() {
      // no-op mock for tests
    }
  },
}), { virtual: false });
