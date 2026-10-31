export default function MergeIdeas({
  api,
  useLoad,
  useApp,
  Heading,
  Loading,
  ErrorBox,
  Category,
  Button,
  Empty,
  categories,
  icons,
  Link,
}) {
  const { useState, useEffect, useRef } = React;
  const {
    Sparkles,
    Plus,
    ArrowRight,
    ArrowUpRight,
    ArrowLeft,
    Check,
    Lock,
    Lightbulb,
    Layers,
    ShieldCheck,
    LoaderCircle,
    X,
  } = icons;
  const { data: ideas = [], loading, error, refresh } = useLoad("/ideas", []);
  const { toast } = useApp();
  const [selected, setSelected] = useState([]),
    [guidance, setGuidance] = useState(""),
    [busy, setBusy] = useState(false),
    [problem, setProblem] = useState(""),
    [preview, setPreview] = useState(null),
    [draft, setDraft] = useState(null),
    [saved, setSaved] = useState(null);
  const reviewRef = useRef(null);
  const active = ideas.filter((i) => !i.archived);
  useEffect(() => {
    if (preview) reviewRef.current?.focus();
  }, [preview]);
  const toggle = (id) => {
    setProblem("");
    setSelected((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : old.length < 5
          ? [...old, id]
          : old,
    );
  };
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const tagList = (value) => [
    ...new Set(
      value
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  async function generate(e) {
    e.preventDefault();
    if (selected.length < 2) {
      setProblem("Choose at least two of your active ideas.");
      return;
    }
    setBusy(true);
    setProblem("");
    try {
      const result = await api("/merge/preview", {
        method: "POST",
        body: { idea_ids: selected, guidance },
      });
      setPreview(result);
      setDraft({
        ...result.draft,
        skills: result.draft.required_skills.join(", "),
        tech: result.draft.technologies.join(", "),
      });
      setSaved(null);
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setProblem("");
    try {
      const result = await api("/ideas", {
        method: "POST",
        body: {
          title: draft.title,
          category: draft.category,
          public_summary: draft.public_summary,
          private_description: draft.private_description,
          privacy: draft.privacy,
          required_skills: tagList(draft.skills),
          technologies: tagList(draft.tech),
        },
      });
      setSaved(result);
      toast("Merged idea saved. Your original ideas are unchanged.");
      refresh();
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  }
  const reset = () => {
    setPreview(null);
    setDraft(null);
    setSelected([]);
    setSaved(null);
    setProblem("");
  };
  return (
    <>
      <Heading
        eyebrow="BRING THE BEST PARTS TOGETHER"
        title="Good ideas. Better together."
        description="Find the connection between your ideas and turn it into one clear direction."
        action={
          <Link to="/ideas/new" className="btn outline">
            <Plus size={16} />
            New idea
          </Link>
        }
      />
      <div className="merge-stepper" aria-label="Merge progress">
        {["Select ideas", "Review the merge", "Make it yours"].map(
          (label, index) => (
            <div
              key={label}
              className={
                (saved ? 2 : preview ? 1 : 0) >= index ? "current" : ""
              }
              aria-current={
                (saved ? 2 : preview ? 1 : 0) === index ? "step" : undefined
              }
            >
              <span>
                {(saved ? 2 : preview ? 1 : 0) > index ? (
                  <Check size={13} />
                ) : (
                  index + 1
                )}
              </span>
              {label}
              {index < 2 && <ArrowRight size={14} />}
            </div>
          ),
        )}
      </div>
      <ErrorBox error={error || problem} />
      {saved ? (
        <section className="merge-success panel">
          <span className="merge-success-icon">
            <Check size={34} />
          </span>
          <div className="eyebrow">A NEW POSSIBILITY, SAVED</div>
          <h2>{saved.title}</h2>
          <p>{saved.public_summary}</p>
          <div className="merge-success-tags">
            <span>
              <Check size={14} />
              Originals preserved
            </span>
            <span>
              <Lock size={14} />
              {saved.privacy === "hidden"
                ? "Hidden until accepted"
                : "Full details protected"}
            </span>
          </div>
          <div className="button-row">
            <Link className="btn primary" to={"/ideas/" + saved.id + "/edit"}>
              Open merged idea <ArrowUpRight size={16} />
            </Link>
            <Link className="btn outline" to={"/matches?idea=" + saved.id}>
              Find collaborators <Sparkles size={16} />
            </Link>
            <Button variant="ghost" onClick={reset}>
              Merge more ideas
            </Button>
          </div>
        </section>
      ) : preview ? (
        <>
          <div className="merge-review-banner">
            <div>
              <span className="merge-engine">
                <Sparkles size={13} />
                {preview.provider}
              </span>
              <h2>One idea. A wider horizon.</h2>
              <p>{preview.rationale}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
                setDraft(null);
                setProblem("");
              }}
            >
              <ArrowLeft size={14} />
              Change selection
            </Button>
          </div>
          <div className="merge-review-layout">
            <form className="panel form-panel" onSubmit={save}>
              <div className="section-head">
                <h2 tabIndex={-1} ref={reviewRef}>
                  Review your merged idea
                </h2>
                <span className="soft-badge">Editable draft</span>
              </div>
              <label>
                Idea title
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </label>
              <div className="form-grid">
                <label>
                  Category
                  <select
                    value={draft.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Visibility
                  <select
                    value={draft.privacy}
                    onChange={(e) => set("privacy", e.target.value)}
                  >
                    <option value="summary_technologies">
                      Summary + technologies
                    </option>
                    <option value="summary">Summary only</option>
                    <option value="hidden">Hidden until accepted</option>
                  </select>
                </label>
              </div>
              <label>
                Public summary{" "}
                <span className="field-badge">
                  Matching uses this text only
                </span>
                <textarea
                  required
                  rows={5}
                  minLength={20}
                  maxLength={2000}
                  value={draft.public_summary}
                  onChange={(e) => set("public_summary", e.target.value)}
                />
                <small>
                  Review before publishing. Keep confidential implementation
                  details out of this field.
                </small>
              </label>
              <label>
                Full private description{" "}
                <span className="field-badge">
                  <Lock size={12} />
                  Protected
                </span>
                <textarea
                  required
                  rows={9}
                  minLength={20}
                  maxLength={20000}
                  value={draft.private_description}
                  onChange={(e) => set("private_description", e.target.value)}
                />
                <small>
                  The full source record is preserved here. Only you can view it
                  before mutual consent.
                </small>
              </label>
              <div className="form-grid">
                <label>
                  Required skills
                  <input
                    value={draft.skills}
                    onChange={(e) => set("skills", e.target.value)}
                  />
                  <small>Comma-separated; up to 30 skills.</small>
                </label>
                <label>
                  Technologies
                  <input
                    value={draft.tech}
                    onChange={(e) => set("tech", e.target.value)}
                  />
                  <small>Comma-separated; up to 30 technologies.</small>
                </label>
              </div>
              <ErrorBox error={problem} />
              <div className="button-row">
                <Button variant="primary" disabled={busy}>
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {busy ? "Saving your idea…" : "Save merged idea"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={reset}
                >
                  Discard draft
                </Button>
              </div>
            </form>
            <aside className="merge-side">
              <section className="panel">
                <span className="eyebrow">THE ORIGINAL SPARKS</span>
                <h3>{preview.sources.length} ideas, connected.</h3>
                {preview.sources.map((source, index) => (
                  <div className="merge-source-mini" key={source.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{source.title}</b>
                      <small>{source.category}</small>
                    </div>
                    <Check size={15} />
                  </div>
                ))}
                <div className="merge-safe">
                  <ShieldCheck size={19} />
                  <p>
                    Saving creates a new idea. Your originals, timestamps, and
                    existing collaborations stay intact.
                  </p>
                </div>
              </section>
              <section className="panel merge-notes">
                <h3>Before you save</h3>
                {preview.warnings.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
              </section>
            </aside>
          </div>
        </>
      ) : (
        <>
          <section className="merge-intro">
            <div>
              <span className="merge-intro-label">
                <Sparkles size={13} />
                IDEA SYNTHESIS STUDIO
              </span>
              <h2>
                Two sparks.
                <br />
                One bigger possibility.
              </h2>
              <p>
                Combine your strongest thinking into an editable idea.
                <br />
                Keep the details, the ownership, and the control.
              </p>
              <div className="merge-intro-proof">
                <span>
                  <ShieldCheck size={14} />
                  Privacy preserved
                </span>
                <span>
                  <Layers size={14} />
                  Originals untouched
                </span>
              </div>
            </div>
            <div className="merge-orbit" aria-hidden="true">
              <span className="merge-orbit-ring" />
              <span className="merge-orbit-card first">
                <Lightbulb size={25} />
                <small>YOUR IDEA</small>
              </span>
              <span className="merge-orbit-card second">
                <Layers size={25} />
                <small>ANOTHER ANGLE</small>
              </span>
              <span className="merge-orbit-center">
                <Sparkles size={32} />
              </span>
              <span className="merge-orbit-dot">✳</span>
            </div>
          </section>
          {loading ? (
            <Loading />
          ) : (
            <form onSubmit={generate} className="merge-select-layout">
              <section>
                <div className="section-head">
                  <div>
                    <h2>Choose the ideas to bring together</h2>
                    <p>
                      Select 2–5 active ideas you own. {selected.length}{" "}
                      selected.
                    </p>
                  </div>
                  <span className="merge-selection-count">
                    {selected.length} / 5
                  </span>
                </div>
                {active.length ? (
                  <div className="merge-source-grid">
                    {active.map((idea) => (
                      <label
                        className={
                          "merge-source-card " +
                          (selected.includes(idea.id) ? "is-selected" : "")
                        }
                        key={idea.id}
                      >
                        <div className="section-head">
                          <Category value={idea.category} />
                          <input
                            type="checkbox"
                            aria-label={"Select " + idea.title}
                            checked={selected.includes(idea.id)}
                            disabled={
                              busy ||
                              (!selected.includes(idea.id) &&
                                selected.length >= 5)
                            }
                            onChange={() => toggle(idea.id)}
                          />
                        </div>
                        <h3>{idea.title}</h3>
                        <p>{idea.public_summary}</p>
                        <div className="tags">
                          {idea.technologies.slice(0, 4).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        <div className="merge-source-footer">
                          <Lock size={12} />
                          {idea.privacy === "hidden"
                            ? "Hidden idea"
                            : "Private details protected"}
                          <span>
                            {new Date(idea.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Start with a couple of ideas."
                    text="Create at least two active ideas to try your first merge."
                    action={
                      <Link className="btn primary" to="/ideas/new">
                        Create an idea <Plus size={16} />
                      </Link>
                    }
                  />
                )}
              </section>
              <aside className="panel merge-control">
                <div className="merge-control-icon">
                  <Sparkles size={24} />
                </div>
                <h2>Connect the dots.</h2>
                <p>One idea with the strengths of each source.</p>
                <div className="merge-picked">
                  {selected.length ? (
                    selected.map((id) => (
                      <div key={id}>
                        <Lightbulb size={14} />
                        <span>{ideas.find((i) => i.id === id)?.title}</span>
                        <button
                          type="button"
                          aria-label={
                            "Remove " + ideas.find((i) => i.id === id)?.title
                          }
                          disabled={busy}
                          onClick={() => toggle(id)}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="small-note">
                      Your selected ideas will appear here.
                    </span>
                  )}
                </div>
                <label>
                  What should the merge focus on?{" "}
                  <span className="optional">Optional</span>
                  <textarea
                    maxLength={600}
                    rows={3}
                    value={guidance}
                    onChange={(e) => setGuidance(e.target.value)}
                    placeholder="e.g. A practical solution for small farms…"
                    disabled={busy}
                  />
                </label>
                <Button
                  variant="primary full"
                  disabled={busy || selected.length < 2}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Sparkles size={17} />
                  )}
                  {busy
                    ? "Bringing your ideas together…"
                    : "Generate merged draft"}
                </Button>
                <div aria-live="polite" className="merge-live">
                  {busy
                    ? "Building a draft. You can review every field before saving."
                    : "Nothing is saved until you review and confirm."}
                </div>
                <div className="merge-control-note">
                  <Lock size={14} />
                  <span>
                    Private descriptions are combined locally. Claude, when
                    configured, receives public abstracts and the merge
                    direction. Keep the direction non-confidential.
                  </span>
                </div>
              </aside>
            </form>
          )}
        </>
      )}
    </>
  );
}
import React from "react";
