import React, { useState } from "react";
import ImageUpload from "./ImageUpload";

const StoreCustomizer: React.FC = () => {
  const [store, setStore] = useState({
    name: "",
    description: "",
    banner: "",
    profile: "",
    theme: "default",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStore({ ...store, [e.target.name]: e.target.value });
  };


  const handleBannerUpload = (url: string) => {
    setStore((prev) => ({ ...prev, banner: url }));
  };
  const handleProfileUpload = (url: string) => {
    setStore((prev) => ({ ...prev, profile: url }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save store customization to backend
    alert("Store customization saved!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2">Customize Your Store</h2>
      <input
        type="text"
        name="name"
        placeholder="Store Name"
        value={store.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        name="description"
        placeholder="Store Description"
        value={store.description}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <ImageUpload label="Banner Image" onUpload={handleBannerUpload} />
      {store.banner && <img src={store.banner} alt="Banner" className="w-full h-32 object-cover rounded mb-2" />}
      <ImageUpload label="Profile Image" onUpload={handleProfileUpload} />
      {store.profile && <img src={store.profile} alt="Profile" className="w-24 h-24 object-cover rounded-full mb-2" />}
      <input
        type="text"
        name="theme"
        placeholder="Theme (e.g. dark, light, custom)"
        value={store.theme}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
        Save Customization
      </button>
    </form>
  );
};

export default StoreCustomizer;
