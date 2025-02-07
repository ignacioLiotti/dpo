import { useEffect, useMemo } from "react";
import { useData } from "@/lib/context/DataContext";
import { DataType } from "@/app/controllers/data.controller";

export function useDataCollection(type: DataType) {
	const { data, loading, error, fetchData } = useData();

	useEffect(() => {
		if (!data[type] && !loading && !error) {
			fetchData(type);
		}
	}, [type, data, loading, error, fetchData]);

	const items = useMemo(() => {
		const collection = data[type];
		if (!Array.isArray(collection)) return [];
		return collection;
	}, [data, type]);

	return {
		data: items,
		loading,
		error,
		refetch: () => fetchData(type),
	};
}
