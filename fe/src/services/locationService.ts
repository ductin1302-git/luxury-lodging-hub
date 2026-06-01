const BASE_LOCATION_API = "https://provinces.open-api.vn/api";

export interface LocationItem {
  name: string;
  code: number;
  division_type: string;
  codename: string;
}

export interface Province extends LocationItem {
  districts: District[];
}

export interface District extends LocationItem {
  wards: Ward[];
}

export interface Ward extends LocationItem {}

export const fetchProvinces = async (): Promise<Province[]> => {
  const response = await fetch(`${BASE_LOCATION_API}/p/`);
  return response.json();
};

export const fetchDistricts = async (provinceCode: number): Promise<District[]> => {
  const response = await fetch(`${BASE_LOCATION_API}/p/${provinceCode}?depth=2`);
  const data = await response.json();
  return data.districts || [];
};

export const fetchWards = async (districtCode: number): Promise<Ward[]> => {
  const response = await fetch(`${BASE_LOCATION_API}/d/${districtCode}?depth=2`);
  const data = await response.json();
  return data.wards || [];
};
