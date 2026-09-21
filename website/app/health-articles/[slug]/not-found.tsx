import { ApplicationState } from "@/components/ApplicationState";

export default function MissingArticle() {
  return <ApplicationState title="missingArticle" body="missingArticleBody" href="/health-articles" action="health" />;
}
