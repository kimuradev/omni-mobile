import axios from "axios";

const api = axios.create({
  baseURL: "https://omnistack-backend-1.herokuapp.com"
});

export default api;
