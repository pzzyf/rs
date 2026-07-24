import { useEffect, useLayoutEffect } from "react";

function Child() {
  console.log(" Child render");

  useLayoutEffect(() => {
    console.log("  Child useLayoutEffect");
  });

  useEffect(() => {
    console.log("  Child useEffect");
  });

  return <div>Child</div>;
}

export function Step2() {
  console.log("f render");

  useLayoutEffect(() => {
    console.log("f useLayoutEffect");
  });

  useEffect(() => {
    console.log("f useEffect");
  });

  return <Child></Child>;
}
