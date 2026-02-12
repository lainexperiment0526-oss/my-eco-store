import React, { useState } from "react";
import ImageUpload from "./ImageUpload";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  categoryId: string;
}

const ProductCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catName, setCatName] = useState("");
  const [product, setProduct] = useState({
    name: "",
    description: "",
    image: "",
    categoryId: "",
  });

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setCategories([...categories, { id: Date.now().toString(), name: catName }]);
    setCatName("");
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || !product.categoryId) return;
    setProducts([
      ...products,
      { ...product, id: Date.now().toString() },
    ]);
    setProduct({ name: "", description: "", image: "", categoryId: "" });
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">Categories</h2>
      <form onSubmit={addCategory} className="flex gap-2 mb-4">
        <input
          type="text"
          value={catName}
          onChange={e => setCatName(e.target.value)}
          placeholder="Category Name"
          className="border p-2 rounded flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 rounded">Add</button>
      </form>
      <ul className="mb-6">
        {categories.map(cat => (
          <li key={cat.id} className="mb-1">{cat.name}</li>
        ))}
      </ul>
      <h2 className="text-xl font-bold mb-2">Products</h2>
      <form onSubmit={addProduct} className="space-y-2 mb-4">
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={e => setProduct({ ...product, name: e.target.value })}
          placeholder="Product Name"
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="description"
          value={product.description}
          onChange={e => setProduct({ ...product, description: e.target.value })}
          placeholder="Product Description"
          className="w-full border p-2 rounded"
        />
        <ImageUpload label="Product Image" onUpload={url => setProduct({ ...product, image: url })} />
        {product.image && <img src={product.image} alt="Preview" className="h-16 mb-2" />}
        <select
          name="categoryId"
          value={product.categoryId}
          onChange={e => setProduct({ ...product, categoryId: e.target.value })}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Add Product</button>
      </form>
      <ul>
        {products.map(prod => (
          <li key={prod.id} className="mb-2">
            <div className="font-semibold">{prod.name}</div>
            <div className="text-sm text-gray-600">{prod.description}</div>
            {prod.image && <img src={prod.image} alt={prod.name} className="h-16 mt-1" />}
            <div className="text-xs text-gray-400">Category: {categories.find(c => c.id === prod.categoryId)?.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductCategoryManager;
