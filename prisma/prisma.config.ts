import { defineConfig } from '@prisma/cli'

export default defineConfig({
  migrations: {
    url: "file:./dev.db"
  }
})
