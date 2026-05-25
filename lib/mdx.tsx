import { MDXRemote } from "next-mdx-remote/rsc";
import { createHighlighter, type Highlighter } from "shiki";
import type { ReactNode } from "react";

let _hl: Highlighter | null = null;
async function getHighlighter() {
  if (_hl) return _hl;
  _hl = await createHighlighter({
    themes: ["github-dark-dimmed"],
    langs: [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "bash",
      "shell",
      "py",
      "python",
      "md",
      "markdown",
      "css",
      "html",
      "yaml",
      "yml",
      "sql",
      "go",
      "rust",
      "dockerfile",
    ],
  });
  return _hl;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const headingFactory = (level: 1 | 2 | 3 | 4) => {
  const Tag = `h${level}` as const;
  return function Heading({ children }: { children?: ReactNode }) {
    const text = typeof children === "string" ? children : String(children ?? "");
    const id = slugify(text);
    return (
      <Tag id={id}>
        <a href={`#${id}`} className="no-underline hover:opacity-80">
          {children}
        </a>
      </Tag>
    );
  };
};

async function CodeBlock({ children, className }: { children?: ReactNode; className?: string }) {
  const lang = className?.replace("language-", "") || "text";
  const code = String(children ?? "").replace(/\n$/, "");
  try {
    const hl = await getHighlighter();
    const html = hl.codeToHtml(code, {
      lang: hl.getLoadedLanguages().includes(lang as never) ? lang : "text",
      theme: "github-dark-dimmed",
    });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  }
}

const components = {
  h1: headingFactory(1),
  h2: headingFactory(2),
  h3: headingFactory(3),
  h4: headingFactory(4),
  pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
  code: ({ children, className }: { children?: ReactNode; className?: string }) => {
    if (!className) {
      return <code>{children}</code>;
    }
    // fenced block
    // @ts-expect-error async server component is fine in MDX
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose max-w-none">
      <MDXRemote
        source={source}
        components={components}
        options={{
          parseFrontmatter: false,
          mdxOptions: { remarkPlugins: [], rehypePlugins: [] },
        }}
      />
    </div>
  );
}
