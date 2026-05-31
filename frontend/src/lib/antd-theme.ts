import type { ThemeConfig } from "antd";

/* Ant Design theme mapped onto Abroadly's warm / emerald palette so antd
 * components feel native to the rest of the (Notion-warm) product. */
export const abroadlyAntdTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0A6E45", // brand emerald
    colorInfo: "#0A6E45",
    colorSuccess: "#0A6E45",
    colorText: "#1B1916", // ink
    colorTextSecondary: "#6B655C", // muted
    colorTextTertiary: "#8A847B", // muted-soft
    colorTextQuaternary: "#A8A29A",
    colorBorder: "#E8E5DD", // line
    colorBorderSecondary: "#EFECE4", // line-soft
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorBgLayout: "#FAF9F6", // paper
    borderRadius: 12,
    borderRadiusLG: 14,
    borderRadiusSM: 8,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: 14,
    controlHeight: 38,
    boxShadow: "0 1px 2px rgba(27,25,22,0.05)",
    boxShadowSecondary: "0 6px 16px -8px rgba(27,25,22,0.12)",
  },
  components: {
    Segmented: {
      itemSelectedBg: "#0A6E45",
      itemSelectedColor: "#FFFFFF",
      itemColor: "#6B655C",
      itemHoverColor: "#1B1916",
      trackBg: "#F4F2EC",
      borderRadius: 10,
      borderRadiusSM: 8,
    },
    Steps: {
      colorPrimary: "#0A6E45",
      iconFontSize: 13,
    },
    Table: {
      headerBg: "#F7F5EF",
      headerColor: "#6B655C",
      headerSplitColor: "transparent",
      borderColor: "#EFECE4",
      rowHoverBg: "#FAF9F6",
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
      fontWeightStrong: 700,
    },
    Card: {
      colorBorderSecondary: "#E8E5DD",
      borderRadiusLG: 16,
      paddingLG: 20,
    },
    Tag: {
      borderRadiusSM: 6,
      fontSizeSM: 11,
    },
    Timeline: {
      tailColor: "#E8E5DD",
      dotBg: "#FAF9F6",
    },
    List: {
      colorBorder: "#EFECE4",
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 22,
    },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
    },
  },
};
