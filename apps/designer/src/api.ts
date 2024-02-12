import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

export const router = t.router({
  greeting: t.procedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return {
      text: `Hello ${input.name}`,
    }
  }),
})
