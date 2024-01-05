import {useState, useCallback, useLayoutEffect, useRef} from "react";

export function useEventListener(o, ev, fn) {
	useLayoutEffect(()=>{
		o.addEventListener(ev,fn);
		return ()=>{
			o.removeEventListener(ev,fn);
		}
	},[o,ev,fn]);
}

/*export function useRefEventListener(ref, ev, fn) {
	useLayoutEffect(()=>{
		let o=ref.current;
		o.addEventListener(ev,fn);
		return ()=>{
			o.removeEventListener(ev,fn);
		}
	},[ref,ref.current,ev,fn]);
}*/

export function useEventUpdate(o, ev) {
	let [_,setDummyState]=useState();
	let forceUpdate=useCallback(()=>setDummyState({}));
	useEventListener(o,ev,forceUpdate);
}
