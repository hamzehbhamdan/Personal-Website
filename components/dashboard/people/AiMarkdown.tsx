import ReactMarkdown from "react-markdown";
export function AiMarkdown({ text }: { text: string }) {
  return (
    <div className="text-[13.5px] leading-[1.65] text-stone-700 [&_ul]:my-1.5 [&_ul]:pl-5 [&_ul]:list-disc [&_strong]:font-semibold">
      <ReactMarkdown allowedElements={["p", "strong", "em", "ul", "ol", "li", "br"]} unwrapDisallowed>{text}</ReactMarkdown>
    </div>
  );
}
