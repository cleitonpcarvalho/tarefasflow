import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema
} from "@/lib/seo";

const schemas = [
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema
];

export function StructuredData() {
  return (
    <>
      {schemas.map((schema) => (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          key={schema["@type"]}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
