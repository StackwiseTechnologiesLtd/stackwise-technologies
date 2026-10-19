import { markdownToContractHtml } from "@/lib/contracts/markdown";

export function ContractMarkdownBody({
  markdown,
  className = "",
}: {
  markdown: string;
  className?: string;
}) {
  const bodyHtml = markdownToContractHtml(markdown);

  return (
    <div
      className={`contract-body prose-contract text-[15px] leading-relaxed text-[#334155] ${className}`}
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
