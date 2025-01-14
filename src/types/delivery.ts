export type DeliveryArea = {
	id: string;
	name: string; // エリア名（例：東京23区、横浜市など）
	center: {
		lat: number;
		lng: number;
	};
	radius: number; // エリアの半径（km）
};

export type DeliveryRoute = {
	id: string;
	areaId: string;
	startPoint: {
		lat: number;
		lng: number;
		address: string;
	};
	waypoints: Array<{
		lat: number;
		lng: number;
		address: string;
		recipient: string;
	}>;
	estimatedDuration: number; // 予想所要時間（分）
	estimatedDistance: number; // 予想距離（km）
};

export type Location = {
	lat: number;
	lng: number;
	address: string;
};
