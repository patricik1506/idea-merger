import os
from sqlalchemy import select
from .models import *
from .security import hash_password
from .matching import embed


def ensure_merge_demo(db):
    """Add one idempotent second idea to the fictional demo member only."""
    member = db.scalar(select(User).where(User.email == "alex@ideamerger.demo"))
    if not member or db.scalar(
        select(Idea.id).where(Idea.user_id == member.id, Idea.title == "HarvestLink")
    ):
        return
    summary = "A farmer-to-market platform connecting small farms with local buyers, sharing crop availability and reducing food waste through demand forecasts."
    vector, model = embed("HarvestLink", "Agriculture", summary)
    db.add(
        Idea(
            user_id=member.id,
            title="HarvestLink",
            category="Agriculture",
            public_summary=summary,
            private_description="Private pilot plan: work with a consented group of growers and local buyers, validate order coordination, and evaluate forecast quality against a private historical dataset. Combine market demand with crop-health guidance while retaining ownership of source research.",
            required_skills=["React", "Data Science"],
            technologies=["React", "Python", "PostgreSQL"],
            privacy="summary",
            embedding=vector,
            embedding_model=model,
        )
    )


def seed():
    if (
        os.getenv("APP_ENV") == "production"
        and not os.getenv("ALLOW_DEMO_SEED") == "true"
    ):
        raise RuntimeError(
            "Demo accounts are disabled in production. Set ALLOW_DEMO_SEED=true only in a disposable demo."
        )
    Base.metadata.create_all(engine)
    with SessionLocal.begin() as db:
        if db.scalar(select(User.id).limit(1)):
            ensure_merge_demo(db)
            print("Existing accounts preserved; merge-demo sample checked.")
            return
        password = os.getenv("DEMO_PASSWORD", "BuildTogether!2026")
        records = [
            ("Admin", "admin@ideamerger.demo", ["Moderation"], ["Python"]),
            (
                "Alex Morgan",
                "alex@ideamerger.demo",
                ["React", "Python", "UI/UX"],
                ["React", "Python", "FastAPI"],
            ),
            (
                "Priya Sharma",
                "priya@ideamerger.demo",
                ["Python", "Machine Learning", "Data Science"],
                ["Python", "TensorFlow", "FastAPI"],
            ),
            (
                "Daniel Kim",
                "daniel@ideamerger.demo",
                ["React", "UI/UX", "Node.js"],
                ["React", "Node.js"],
            ),
            (
                "Sofia Chen",
                "sofia@ideamerger.demo",
                ["Python", "IoT", "Data Science"],
                ["Python", "Arduino", "FastAPI"],
            ),
            (
                "Arjun Patel",
                "arjun@ideamerger.demo",
                ["Python", "Machine Learning", "React"],
                ["Python", "React", "FastAPI"],
            ),
        ]
        people = []
        for name, email, skills, tech in records:
            u = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="admin" if name == "Admin" else "user",
            )
            db.add(u)
            db.flush()
            people.append(u)
            db.add(
                Profile(
                    user_id=u.id,
                    skills=skills,
                    technologies=tech,
                    interests=["AI/ML", "Sustainable technology"],
                    experience="Student",
                    goals="Build meaningful products with a complementary team.",
                )
            )
            db.add(TermsAcceptance(user_id=u.id))
        examples = [
            (
                "GrowSense",
                "Agriculture",
                "An intelligent farming platform that uses crop images and environmental data to help small farmers identify plant diseases and improve crop health.",
                ["Machine Learning", "Python"],
                ["Python", "React", "FastAPI"],
            ),
            (
                "LeafLens",
                "Agriculture",
                "A machine learning tool for early plant disease detection using leaf images, with accessible treatment guidance for small-scale farmers.",
                ["React", "UI/UX"],
                ["Python", "React", "TensorFlow"],
            ),
            (
                "LearnLoop",
                "Education",
                "A personalized learning companion that identifies student knowledge gaps and recommends bite-sized lessons and collaborative study groups.",
                ["Python", "Machine Learning"],
                ["React", "Node.js"],
            ),
            (
                "FieldPulse",
                "Agriculture",
                "Low-cost environmental sensors and predictive crop analytics to help farmers optimize irrigation, detect disease risks and conserve water.",
                ["React", "Data Science"],
                ["Python", "Arduino", "FastAPI"],
            ),
            (
                "CareBridge",
                "Healthcare",
                "A privacy-conscious health assistant connecting rural patients with care guidance, symptom triage and local healthcare professionals.",
                ["React", "UI/UX"],
                ["Python", "React", "FastAPI"],
            ),
        ]
        ideas = []
        for u, (title, cat, summary, skills, tech) in zip(people[1:], examples):
            vector, model = embed(title, cat, summary)
            i = Idea(
                user_id=u.id,
                title=title,
                category=cat,
                public_summary=summary,
                private_description=summary
                + " Private implementation: validate a pilot with 20 participants, use an opt-in dataset, and measure usefulness through structured feedback before expanding. Keep the evaluation dataset and research interviews confidential.",
                required_skills=skills,
                technologies=tech,
                privacy="summary_technologies",
                embedding=vector,
                embedding_model=model,
            )
            db.add(i)
            db.flush()
            ideas.append(i)
        ensure_merge_demo(db)
        # A pending incoming invitation demonstrates consent, without unlocking content.
        db.add(
            CollaborationRequest(
                sender_id=people[3].id,
                receiver_id=people[1].id,
                source_idea_id=ideas[2].id,
                target_idea_id=ideas[0].id,
                message="Your approach to accessible tools resonates with me. I would love to explore how my design skills could help.",
                sender_consented=True,
            )
        )
        db.add(
            Notification(
                user_id=people[1].id, text="Daniel Kim invited you to collaborate"
            )
        )
    print(
        "Seeded admin + five demo members, six ideas, and merge-ready examples. Password: configured DEMO_PASSWORD (default documented in README)."
    )


if __name__ == "__main__":
    seed()
