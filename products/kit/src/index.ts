import { ProductKitProvider } from './context'

export { ProductKitContext } from './context'

export default {
  id: 'kit'
  components: {
  ProductProvider: ProductKitProvider,
    ProductView: ProductKitView,
}
}
