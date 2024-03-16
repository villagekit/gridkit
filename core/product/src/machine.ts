import { assign, setup } from 'xstate'
import type { ProductData, ProductModule } from './types'

export type ProductMachineInput = ProductData & {
  Products: Array<ProductModule>
}

export type ProductMachineContext = ProductMachineInput & {
  Product: ProductModule
}

export type ProductMachineEvent = { type: 'updateInput'; input: ProductMachineInput }

export const productMachine = setup({
  types: {} as {
    context: ProductMachineContext
    input: ProductMachineInput
    events: ProductMachineEvent
  },
}).createMachine({
  id: 'product',
  context: ({ input }) => getContextFromInput(input),
  on: {
    updateInput: {
      actions: [
        assign(({ event }) => {
          return getContextFromInput(event.input)
        }),
      ],
    },
  },
})

function getContextFromInput(input: ProductMachineInput): ProductMachineContext {
  const { Products, meta } = input
  const Product = Products.find((P) => P.id === meta.type)
  if (Product == null) {
    throw new Error(`Unknown product type: ${meta.type}`)
  }
  return {
    Product,
    ...input,
  }
}
