import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type NotificationEmailProps = {
  preview?: string;
  heading: string;
  paragraphs?: string[];
  details?: Array<[label: string, value: string]>;
  cta?: { label: string; url: string };
  footnote?: string;
};

const navy = "#1a2c4e";
const gold = "#ffcc00";

export function NotificationEmail({ preview, heading, paragraphs = [], details, cta, footnote }: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={{ backgroundColor: "#f4f6fa", fontFamily: "'Open Sans', Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", border: "1px solid #e6e9f0" }}>
          <Section style={{ backgroundColor: navy, padding: "20px 28px" }}>
            <Text style={{ color: "#ffffff", fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, margin: 0 }}>
              BC<span style={{ color: gold }}>Learns</span>
            </Text>
          </Section>
          <Section style={{ padding: "28px" }}>
            <Heading as="h2" style={{ color: navy, fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 16px" }}>
              {heading}
            </Heading>
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ color: "#333", fontSize: 15, lineHeight: "24px", margin: "0 0 12px" }}>
                {p}
              </Text>
            ))}
            {details?.length ? (
              <Section style={{ backgroundColor: "#f7f8fb", borderRadius: 8, padding: "12px 16px", margin: "8px 0 16px" }}>
                {details.map(([label, value]) => (
                  <Text key={label} style={{ fontSize: 14, margin: "4px 0", color: "#333" }}>
                    <strong style={{ color: navy }}>{label}:</strong> {value}
                  </Text>
                ))}
              </Section>
            ) : null}
            {cta ? (
              <Button
                href={cta.url}
                style={{ backgroundColor: gold, color: navy, fontWeight: 700, padding: "12px 22px", borderRadius: 8, fontSize: 14, textDecoration: "none" }}
              >
                {cta.label}
              </Button>
            ) : null}
            <Hr style={{ borderColor: "#eceef3", margin: "28px 0 12px" }} />
            <Text style={{ color: "#8a91a3", fontSize: 12, margin: 0 }}>
              {footnote ?? "Bergen County Learns · hello@bclearns.com"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
