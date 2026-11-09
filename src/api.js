const API_URL = import.meta.env.VITE_API_URL;

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error("Unable to load products");
  }

  return response.json();
}

export async function uploadCameraImage(image) {
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image })
  });

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  return response.json();
}

export async function saveCartItem(productId, quantity) {
  const response = await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      productId,
      quantity
    })
  });

  if (!response.ok) {
    throw new Error("Unable to save cart");
  }

  return response.json();
}