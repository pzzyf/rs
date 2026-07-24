import { useEffect, useState } from "react";

export function Demo() {
	const [count, setCount] = useState(0);

	// effect 1：改变 effect 2 的依赖
	useEffect(() => {
		setCount(1);
	}, []);

	// effect 2：依赖 count
	useEffect(() => {
		console.log("effect2 执行, count =", count);
		return () => console.log("effect2 清理, count =", count);
	}, [count]);

    return (
        <></>
    )
}