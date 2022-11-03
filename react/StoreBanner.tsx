import React, { useEffect, useRef, useState } from "react";
//@ts-expect-error
import { createPortal } from "react-dom";
import { canUseDOM } from "vtex.render-runtime";

import styles from "./styles.css";

interface StoreBannerProps {

}

const StoreBanner: StorefrontFunctionComponent<StoreBannerProps> = ({ }) => {
  const openGate = useRef(true);

  return <>Store Banner</>;
}

StoreBanner.schema = {
  title: "Store Banner",
  type: "object",
  properties: {}
}

export default StoreBanner;