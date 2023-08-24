import React, { useEffect, useRef, useState } from "react";
// import { createPortal } from "react-dom";
import { canUseDOM } from "vtex.render-runtime";

import styles from "./styles.css";

interface StoreBannerProps {
  override: boolean
  banners: Array<BannerObject>
}

interface BannerObject {
  __editorItemTitle: string
  active: boolean
  endDate: string
  storePath?: string
  imgSrc: string
  text: string
  subText: string
  link: string,
  blockClass: string
}

interface ImageBanner {
  imgSrc: string
  link: string
}

interface TextBanner {
  text: string
  subText: string
  link: string
  blockClass: string
}

const blankBanner: BannerObject = {
  __editorItemTitle: "",
  active: false,
  endDate: "",
  imgSrc: "",
  text: "",
  subText: "",
  link: "",
  blockClass: ""
}

const StoreBanner: StorefrontFunctionComponent<StoreBannerProps> = ({ override, banners }) => {
  const openGate = useRef(true);
  const bannerType = useRef("");
  const [bannerInfo, setBannerInfo] = useState<any>(blankBanner);

  // Run and reset state.
  useEffect(() => {
    if (!openGate.current) return;
    openGate.current = false;

    bannerType.current = "";
    setBannerInfo(blankBanner);
    // If override is set to true, ignore all other banners.
    override ? runOverRide() : findBanner();
  })

  // Finds override position in the banners array and calls build banner.
  const runOverRide = () => {
    let overRideIndex = -1;
    for (let index = 0; index < banners.length; index++) {
      if (banners[index].__editorItemTitle.toLowerCase() === "override") {
        overRideIndex = index;
        break;
      }
    }

    // If no override banner is found, run findBanner() instead.
    overRideIndex > -1 ? buildBanner(overRideIndex) : findBanner();
  }

  // Loops through banners array and finds match with the user's URL.
  const findBanner = () => {
    if (!canUseDOM) return;
    let bannerFound = false;

    const fullPath = window.location.href;
    const isAdmin = fullPath.includes("siteEditor=true");
    // Site editor runs in an iFrame. This determines where to find the URL string to match.
    const storePath = isAdmin ? fullPath.split(".com/store/")[1].split("?")[0].toLowerCase() : fullPath.split(".com/store/")[1].toLowerCase();

    for (let index = 0; index < banners.length; index++) {
      const bannerItemStore = banners[index].storePath!.toLowerCase();

      const overrideCatch = banners[index].__editorItemTitle.toLowerCase() !== "override";
      const defaultCatch = banners[index].__editorItemTitle.toLowerCase() !== "default";

      // Don't search Override or Default Banners.
      if (overrideCatch && defaultCatch) {

        // includes() instead of === to match any reference links.
        if (storePath.includes(bannerItemStore)) {
          buildBanner(index);
          bannerFound = true;
          break;
        }
      }
    }

    // If no match was found, run show default banner.
    if (!bannerFound) buildDefaultBanner();
  }

  // Determines if banner should "display" no banner.
  // Determines type of banner, Image or Text. Calls appropriate function.
  // If banner is active, determine type of banner to build.
  // If banner is inactive, build default banner.
  const buildBanner = (index: number) => {
    const banner = banners[index];

    // Store desires no banner at all.
    if (!banner.text && !banner.imgSrc && banner.active) {
      bannerType.current = "nobanner";
      setBannerInfo({});
      return;
    }

    if (banner.endDate) {
      const rightNow = Date.now();
      const penultimateSecond = 8.64e+7 - 1000;
      const isExpired = rightNow > (Date.parse(banner.endDate) + penultimateSecond);
      if (isExpired) {
        buildDefaultBanner();
        return;
      }
    }

    banner.active ? banner.imgSrc ? buildImagebanner(banner) : buildTextBanner(banner) : buildDefaultBanner();
  }

  // Builds and renders an Image type banner.
  const buildImagebanner = (banner: BannerObject) => {
    const tempBannerInfo: ImageBanner = {
      imgSrc: banner.imgSrc,
      link: banner.link || ""
    }
    bannerType.current = "image";
    setBannerInfo(tempBannerInfo);
  }

  // Builds and renders a Text type banner.
  const buildTextBanner = (banner: BannerObject) => {
    const tempTextBanner: TextBanner = {
      text: banner.text,
      subText: banner.subText || "",
      link: banner.link || "",
      blockClass: banner.blockClass || ""
    }
    bannerType.current = "text";
    setBannerInfo(tempTextBanner);
  }

  // No override and no individual store banner is found for current URL.
  // Finds default banner position in banners array and builds appropriate
  // type of banner.
  const buildDefaultBanner = () => {
    let defaultIndex = -1;

    for (let index = 0; index < banners.length; index++) {
      if (banners[index].__editorItemTitle.toLowerCase() === "default") {
        defaultIndex = index;
        break;
      }
    }

    // This condition should only fire if there's no default banner set. Will show blank banner.
    if (defaultIndex === -1) {
      bannerType.current = "";
      return;
    }

    const banner = banners[defaultIndex];
    banner.imgSrc ? buildImagebanner(banner) : buildTextBanner(banner);
  }

  const NoBanner = () => <></>;

  // This component lessens layout shift on first paint.
  const BlankBanner = () => <div className={styles.blankBanner} />

  const ImageBannerComponent = () =>
    // Hack - Fix later.
    <div style={{ height: "auto", backgroundColor: "transparent" }} className={styles.container}>
      <div style={{ padding: "0" }} className={styles.wrapper}>
        <img src={bannerInfo.imgSrc} className={styles.image} />
      </div>
    </div>

  const TextBannerComponent = () =>
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.text}>{bannerInfo.text}</div>
        {bannerInfo.subText && <div className={bannerInfo.blockClass ? `${styles.subText}--${bannerInfo.blockClass}` : styles.subText}>
          {bannerInfo.subText}
        </div>}
      </div>
    </div>

  const LinkedBannerComponent = () => <a href={bannerInfo.link} className={styles.link}><BannerComponent /></a>

  const BannerComponent = () => bannerType.current === "nobanner" ? <NoBanner /> : bannerType.current === "image" ? <ImageBannerComponent /> : bannerType.current === "text" ? <TextBannerComponent /> : <BlankBanner />;

  return bannerInfo.link ? <LinkedBannerComponent /> : <BannerComponent />
}

StoreBanner.schema = {
  title: "Store Banner",
  type: "object",
  properties: {
    override: {
      title: "Master Override Switch",
      description: "Turn on to display the Override banner on all store pages.",
      type: "boolean",
      default: false
    },
    banners: {
      title: "Banners",
      type: "array",
      items: {
        properties: {
          __editorItemTitle: {
            title: "Name",
            type: "string"
          },
          active: {
            title: "Active. 'Off' reverts to Default Banner.",
            type: "boolean",
            default: true
          },
          endDate: {
            title: "Active Until",
            description: "Will display until the final second of this day. Leave blank to ignore. Example: 2023-02-14",
            type: "string"
          },
          storePath: {
            title: "Store Path",
            description: "Text after the .com/store/ in URL.",
            type: "string"
          },
          imgSrc: {
            title: "Image Source URL",
            description: "Optional | Absolute Path to image. Image will override text.",
            type: "string"
          },
          text: {
            title: "Banner Text",
            description: "Optional | Leave blank if Image is being used.",
            type: "string",
          },
          subText: {
            title: "Banner SubText or Button Text",
            description: "Optional | Leave blank if not desired.",
            type: "string"
          },
          blockClass: {
            title: "Style",
            description: "Optional | Absolute or Relative path to URL.",
            type: "string",
            enum: ["standard", "button"],
            default: "standard"
          },
          link: {
            title: "Link",
            description: "Optional | Absolute or Relative path to URL.",
            type: "string"
          }
        }
      }
    }
  }
}

export default StoreBanner;