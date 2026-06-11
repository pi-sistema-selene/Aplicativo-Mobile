import axios from "axios";
import { API_V1 } from "@/constants/api";

const api = axios.create({
  baseURL: API_V1,
});

export default api;
export { api };
