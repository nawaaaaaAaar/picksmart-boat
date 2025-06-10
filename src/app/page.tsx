export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Picksmart Stores
        </h1>
        <p className="text-xl text-gray-600">
          Qatar&apos;s Premier Smart Shopping Platform - MVP
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">🛍️ Products</h2>
          <p className="text-gray-600">Browse our product catalog</p>
          <a href="/products" className="text-blue-600 hover:underline">
            View Products →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">🛒 Cart</h2>
          <p className="text-gray-600">Manage your shopping cart</p>
          <a href="/cart" className="text-blue-600 hover:underline">
            View Cart →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">👤 Account</h2>
          <p className="text-gray-600">Login or register</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Login →
          </a>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-lg font-medium mb-4">MVP Status</h3>
        <div className="bg-yellow-100 border border-yellow-400 rounded p-4">
          <p className="text-yellow-800">
            🚧 This is the MVP version. Basic functionality only. 
            Design will be improved in Phase 2.
          </p>
        </div>
      </div>
    </div>
  )
} 