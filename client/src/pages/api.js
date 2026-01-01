const API_BASE_URL =
  import.meta.env.VITE_API_URL || ""; 

export const apiFetch = (path, options = {}) => {
  return fetch(`${API_BASE_URL}${path}`, options);
};
export const apiGet = (path, params = {}) => {
  return axios.get(`${API_BASE_URL}${path}`, { params });
};

export const apiPost = async (path, data) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: data,
  });
  return res.json();
};

export default API_BASE_URL;
