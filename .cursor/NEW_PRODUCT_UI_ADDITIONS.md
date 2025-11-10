# UI Additions for New Product Workflow

## Location: Step 2 Product Selection (Line ~720 in page.tsx)

Add this AFTER the header but BEFORE the product filters:

```tsx
{/* Step 2: Product Selection - Enhanced */}
{createStep === 'products' && (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-label">
        Select Products ({selectedProducts.size} selected)
      </h3>
      <div className="flex items-center gap-2">
        {/* ADD THIS BUTTON FOR INBOUND POs */}
        {activeTab === 'inbound' && (
          <button
            onClick={() => setShowNewProductForm(!showNewProductForm)}
            className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-xs uppercase tracking-wider hover:bg-green-500/30 transition-all"
          >
            <Plus size={14} />
            {showNewProductForm ? 'Cancel' : 'Add New Product'}
          </button>
        )}

        {/* Existing view mode buttons */}
        <button onClick={() => setViewMode('grid')} ...>
          <Grid size={16} />
        </button>
        <button onClick={() => setViewMode('list')} ...>
          <List size={16} />
        </button>
      </div>
    </div>

    {/* NEW PRODUCT FORM - ADD THIS */}
    {showNewProductForm && activeTab === 'inbound' && (
      <Card className="mb-4 border-green-500/30 bg-green-500/5">
        <div className="p-4">
          <h4 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
            <Package size={16} className="text-green-400" />
            Add New Product from Supplier
          </h4>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Product Name *</label>
              <input
                type="text"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                placeholder="e.g., Purple Haze"
                className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">Supplier SKU</label>
              <input
                type="text"
                value={newProductForm.supplier_sku}
                onChange={(e) => setNewProductForm({...newProductForm, supplier_sku: e.target.value})}
                placeholder="Supplier's product code"
                className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">Your SKU (optional)</label>
              <input
                type="text"
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({...newProductForm, sku: e.target.value})}
                placeholder="Auto-generated if blank"
                className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">Category *</label>
              <select
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Uncategorized">Uncategorized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">Unit Cost *</label>
              <input
                type="number"
                step="0.01"
                value={newProductForm.unit_cost}
                onChange={(e) => setNewProductForm({...newProductForm, unit_cost: e.target.value})}
                placeholder="0.00"
                className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">Brand (optional)</label>
              <input
                type="text"
                value={newProductForm.brand}
                onChange={(e) => setNewProductForm({...newProductForm, brand: e.target.value})}
                placeholder="e.g., Cookies, Jungle Boys"
                className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewProductForm(false)}
              className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNewProduct}
              className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider bg-green-500 text-white hover:bg-green-600 transition-all"
            >
              Add to PO
            </button>
          </div>
        </div>
      </Card>
    )}

    {/* Show new products list if any exist */}
    {newProducts.length > 0 && (
      <Card className="mb-4 border-green-500/30 bg-green-500/5">
        <div className="p-4">
          <h4 className="text-green-400 text-sm font-medium mb-3">
            New Products ({newProducts.length})
          </h4>
          <div className="space-y-2">
            {newProducts.map((np) => {
              const selection = selectedProducts.get(np.tempId);
              return (
                <div key={np.tempId} className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-green-500/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{np.name}</span>
                      <Badge variant="success" className="text-xs">NEW</Badge>
                    </div>
                    <div className="text-xs text-white/60">
                      SKU: {np.sku} • Category: {np.category} • ${np.unit_cost.toFixed(2)}
                    </div>
                  </div>

                  {selection && (
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-white/40 text-xs block mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={selection.quantity}
                          onChange={(e) => updateProductQuantity(np.tempId, parseInt(e.target.value) || 1)}
                          className="w-20 bg-black border border-white/10 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeNewProduct(np.tempId)}
                        className="p-2 hover:bg-red-500/10 border border-red-500/20 rounded-md transition-all"
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    )}

    {/* Existing product filters and grid/list continue below... */}
```

## Summary of Changes:

1. **"+ Add New Product" Button**: Green button that appears only for inbound POs
2. **New Product Form**: Collapsible form with 6 fields (name, SKUs, category, cost, brand)
3. **New Products List**: Shows all added new products with "NEW" badge
4. **Remove Button**: X button to remove new products before submitting

## User Experience:

1. User creating inbound PO
2. Clicks "+ Add New Product"
3. Form appears with green theme
4. Fills in product details
5. Clicks "Add to PO"
6. Product appears in "New Products" section with green badge
7. Can add quantity
8. Can remove if mistake
9. On submit, API creates product stubs with status='po_only'
