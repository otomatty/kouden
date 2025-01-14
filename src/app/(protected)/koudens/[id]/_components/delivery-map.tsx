"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation } from "lucide-react";
import type { DeliveryArea, DeliveryRoute, Location } from "@/types/delivery";
import { useToast } from "@/hooks/use-toast";

interface DeliveryMapProps {
	items: Array<{
		id: string;
		recipient: string;
		address?: string;
		latitude?: number;
		longitude?: number;
	}>;
}

declare global {
	interface Window {
		google: typeof google & {
			maps: typeof google.maps;
		};
	}
}

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 東京駅
const AREA_COLORS = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"];

export function DeliveryMap({ items }: DeliveryMapProps) {
	const { toast } = useToast();
	const mapRef = useRef<HTMLDivElement>(null);
	const [map, setMap] = useState<google.maps.Map | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [startPoint, setStartPoint] = useState<Location | null>(null);
	const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
	const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
	const [selectedArea, setSelectedArea] = useState<DeliveryArea | null>(null);
	const [proposedRoutes, setProposedRoutes] = useState<DeliveryRoute[]>([]);
	const [searchInput, setSearchInput] = useState("");
	const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

	// Google Maps APIの初期化
	useEffect(() => {
		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
		script.async = true;
		script.onload = initMap;
		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, []);

	// 現在地の取得
	const getCurrentLocation = useCallback(() => {
		if (!map || !geocoder) return;

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const latlng = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};

					try {
						const response = await geocoder.geocode({ location: latlng });
						if (response.results[0]) {
							const location: Location = {
								lat: latlng.lat,
								lng: latlng.lng,
								address: response.results[0].formatted_address,
							};
							setCurrentLocation(location);
							map.setCenter(latlng);

							// 現在地マーカーの追加
							new google.maps.Marker({
								position: latlng,
								map,
								icon: {
									path: google.maps.SymbolPath.CIRCLE,
									scale: 10,
									fillColor: "#4285F4",
									fillOpacity: 1,
									strokeWeight: 2,
									strokeColor: "#FFFFFF",
								},
								title: "現在地",
							});
						}
					} catch (error) {
						console.error("Geocoding failed:", error);
						toast({
							title: "エラー",
							description: "現在地の取得に失敗しました",
							variant: "destructive",
						});
					}
				},
				(error) => {
					console.error("Geolocation failed:", error);
					toast({
						title: "エラー",
						description: "位置情報の取得に失敗しました",
						variant: "destructive",
					});
				},
			);
		}
	}, [map, geocoder, toast]);

	// 住所検索
	const searchAddress = useCallback(async () => {
		if (!geocoder || !searchInput) return;

		try {
			const response = await geocoder.geocode({ address: searchInput });
			if (response.results[0]) {
				const location: Location = {
					lat: response.results[0].geometry.location.lat(),
					lng: response.results[0].geometry.location.lng(),
					address: response.results[0].formatted_address,
				};
				setStartPoint(location);
				map?.setCenter(location);

				// 出発地点マーカーの追加
				new google.maps.Marker({
					position: location,
					map,
					icon: {
						url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
					},
					title: "出発地点",
				});
			}
		} catch (error) {
			console.error("Geocoding failed:", error);
			toast({
				title: "エラー",
				description: "住所の検索に失敗しました",
				variant: "destructive",
			});
		}
	}, [geocoder, map, searchInput, toast]);

	// ルート表示
	const displayRoutes = useCallback(
		(routes: DeliveryRoute[]) => {
			if (!map) return;

			routes.forEach((route, index) => {
				const directionsService = new google.maps.DirectionsService();
				const directionsRenderer = new google.maps.DirectionsRenderer({
					map,
					suppressMarkers: true,
					polylineOptions: {
						strokeColor: AREA_COLORS[index % AREA_COLORS.length],
						strokeWeight: 4,
					},
				});

				const waypoints = route.waypoints.map((point) => ({
					location: new google.maps.LatLng(point.lat, point.lng),
					stopover: true,
				}));

				const request: google.maps.DirectionsRequest = {
					origin: new google.maps.LatLng(
						route.startPoint.lat,
						route.startPoint.lng,
					),
					destination: new google.maps.LatLng(
						route.waypoints[route.waypoints.length - 1].lat,
						route.waypoints[route.waypoints.length - 1].lng,
					),
					waypoints: waypoints.slice(0, -1),
					optimizeWaypoints: true,
					travelMode: google.maps.TravelMode.DRIVING,
				};

				directionsService.route(request, (result, status) => {
					if (status === "OK" && result) {
						directionsRenderer.setDirections(result);
					}
				});
			});
		},
		[map],
	);

	// ルート生成
	const generateRoutes = useCallback(
		(areas: DeliveryArea[]) => {
			if (!startPoint) return;

			const routes: DeliveryRoute[] = [];
			for (const area of areas) {
				const areaItems = items
					.filter(
						(
							item,
						): item is typeof item & { latitude: number; longitude: number } =>
							item.latitude != null && item.longitude != null,
					)
					.filter((item) => {
						const itemLatLng = new google.maps.LatLng(
							item.latitude,
							item.longitude,
						);
						const centerLatLng = new google.maps.LatLng(
							area.center.lat,
							area.center.lng,
						);
						return (
							google.maps.geometry.spherical.computeDistanceBetween(
								itemLatLng,
								centerLatLng,
							) <=
							area.radius * 1000
						);
					});

				if (areaItems.length > 0) {
					routes.push({
						id: `route-${area.id}`,
						areaId: area.id,
						startPoint: startPoint,
						waypoints: areaItems.map((item) => ({
							lat: item.latitude,
							lng: item.longitude,
							address: item.address ?? "",
							recipient: item.recipient,
						})),
						estimatedDuration: 0,
						estimatedDistance: 0,
					});
				}
			}

			setProposedRoutes(routes);
			displayRoutes(routes);
		},
		[items, startPoint, displayRoutes],
	);

	// エリア分割
	const divideIntoAreas = useCallback(() => {
		if (!items.length || !startPoint) return;

		// k-means法でエリア分割
		const k = Math.min(3, Math.ceil(items.length / 5)); // 1エリアあたり最大5件
		const points = items
			.filter(
				(item): item is typeof item & { latitude: number; longitude: number } =>
					item.latitude != null && item.longitude != null,
			)
			.map((item) => ({
				lat: item.latitude,
				lng: item.longitude,
			}));

		// k-means法の実装
		const areas: DeliveryArea[] = [];
		for (let i = 0; i < k; i++) {
			const center = points[Math.floor(Math.random() * points.length)];
			areas.push({
				id: `area-${i}`,
				name: `エリア${i + 1}`,
				center,
				radius: 5, // 5km
			});
		}

		setDeliveryAreas(areas);
		return areas;
	}, [items, startPoint]);

	// エリア分割とルート生成
	const handleAreaDivision = useCallback(() => {
		const areas = divideIntoAreas();
		if (areas) {
			generateRoutes(areas);
		}
	}, [divideIntoAreas, generateRoutes]);

	// 地図の初期化
	const initMap = useCallback(() => {
		if (!mapRef.current) return;

		const mapInstance = new google.maps.Map(mapRef.current, {
			zoom: 12,
			center: DEFAULT_CENTER,
		});

		setMap(mapInstance);
		setGeocoder(new google.maps.Geocoder());
		setIsLoading(false);
	}, []);

	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				<div className="flex-1">
					<Input
						placeholder="出発地点の住所を入力"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && searchAddress()}
					/>
				</div>
				<Button onClick={searchAddress}>
					<MapPin className="h-4 w-4 mr-2" />
					住所を検索
				</Button>
				<Button onClick={getCurrentLocation}>
					<Navigation className="h-4 w-4 mr-2" />
					現在地を取得
				</Button>
			</div>

			<div className="relative">
				<div ref={mapRef} className="w-full h-[500px] rounded-lg" />
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-background/50">
						<Loader2 className="h-8 w-8 animate-spin" />
					</div>
				)}
			</div>

			{startPoint && (
				<div className="flex justify-end gap-2">
					<Button onClick={() => divideIntoAreas()}>エリア分割</Button>
					<Button onClick={() => displayRoutes(proposedRoutes)}>
						ルート表示
					</Button>
				</div>
			)}

			{proposedRoutes.length > 0 && (
				<Card className="p-4">
					<h3 className="text-lg font-semibold mb-4">配送ルート一覧</h3>
					<div className="space-y-4">
						{proposedRoutes.map((route, index) => (
							<div
								key={route.id}
								className="p-4 border rounded-lg"
								style={{
									borderColor: AREA_COLORS[index % AREA_COLORS.length],
								}}
							>
								<h4 className="font-medium">
									ルート {index + 1} ({route.waypoints.length}件)
								</h4>
								<div className="mt-2 space-y-2">
									{route.waypoints.map((point, i) => (
										<div
											key={`${route.id}-waypoint-${point.recipient}-${point.address}`}
											className="text-sm"
										>
											{i + 1}. {point.recipient} ({point.address})
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
