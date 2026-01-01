const API_BASE_URL =
  import.meta.env.VITE_API_URL || ""; 

export const apiFetch = (path, options = {}) => {
  return fetch(`${API_BASE_URL}${path}`, options);
};
export const apiGet = async (path, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}${path}?${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const apiPost = async (path, data) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: data,
  });
   if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
};


export default API_BASE_URL;
