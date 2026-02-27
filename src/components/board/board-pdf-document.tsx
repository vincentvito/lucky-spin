"use client";

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

interface BoardPDFProps {
  logoUrl: string | null;
  qrCodeDataUrl: string;
  headline: string;
  subheadline: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  logo: {
    width: 180,
    height: 90,
    objectFit: "contain",
    marginBottom: 30,
  },
  qrCode: {
    width: 280,
    height: 280,
    marginBottom: 30,
  },
  headline: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.8,
  },
  divider: {
    width: "60%",
    height: 4,
    marginTop: 10,
  },
});

export function BoardPDFDocument({
  logoUrl,
  qrCodeDataUrl,
  headline,
  subheadline,
  bgColor,
  textColor,
  accentColor,
}: BoardPDFProps) {
  return (
    <Document>
      <Page
        size="A4"
        style={[styles.page, { backgroundColor: bgColor }]}
      >
        {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        <Image src={qrCodeDataUrl} style={styles.qrCode} />
        <Text style={[styles.headline, { color: textColor }]}>
          {headline}
        </Text>
        <Text style={[styles.subheadline, { color: textColor }]}>
          {subheadline}
        </Text>
        <View
          style={[styles.divider, { backgroundColor: accentColor }]}
        />
      </Page>
    </Document>
  );
}
