import { useEffect } from "react";
import { useData } from "@/lib/context/DataContext";
import { DataType } from "@/app/controllers/data.controller";

export function useDataItem(type: DataType, id?: number) {
	const { data, loading, error, fetchData } = useData();
	const key = id ? `${type}-${id}` : type;
	const item = data[key];

	useEffect(() => {
		if (!item && !loading && !error) {
			fetchData(type, id);
		}
	}, [type, id, item, loading, error, fetchData]);

	return {
		data: item,
		loading,
		error,
		refetch: () => fetchData(type, id),
	};
}
