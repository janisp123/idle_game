import unittest
from copy import deepcopy
from release_gate import SUITES, research_only, verify_revision, check_results

def results(research=False):
    return {"scope": {"result": "success", "outputs": {"research_only": str(research).lower()}},
            "protocol": {"result": "success"},
            **{name: {"result": "skipped" if research else "success"} for name in SUITES}}

def change(path, status="modified"):
    return {"filename": path, "status": status}

class ReleaseGateTests(unittest.TestCase):
    def test_full_suite_success(self):
        self.assertEqual(len(check_results(results())), 10)
    def test_each_suite_failure_cancel_skip_or_missing_blocks(self):
        for name in ("scope", "protocol", *SUITES):
            for status in ("failure", "cancelled", "skipped", "timed_out", "neutral", None):
                with self.subTest(name=name, status=status):
                    r = results()
                    r[name]["result"] = status
                    with self.assertRaises(ValueError):
                        check_results(r)
            r = results()
            del r[name]
            with self.assertRaises(ValueError):
                check_results(r)
    def test_research_requires_exactly_expected_skips_and_protocol(self):
        self.assertEqual(check_results(results(True))["website"], "skipped")
        for name in SUITES:
            r = results(True)
            r[name]["result"] = "failure"
            with self.assertRaises(ValueError):
                check_results(r)
        r = results(True)
        r["protocol"]["result"] = "failure"
        with self.assertRaises(ValueError):
            check_results(r)
    def test_missing_classification_fails(self):
        r = results()
        del r["scope"]["outputs"]
        with self.assertRaises(ValueError):
            check_results(r)
    def test_allowlist(self):
        self.assertTrue(research_only([change("docs/library/new.md", "added"), change("docs/RESEARCH_LIBRARY.md")]))
        for f in [change("docs/library/new.md", "removed"), change("docs/library/new.md", "renamed"),
                  change("docs/library/nested/new.md"), change("docs/WORK_CHECKPOINT.md"),
                  change("AGENTS.md"), change(".github/workflows/pages.yml"), change("site/play/engine.mjs")]:
            self.assertFalse(research_only([change("docs/library/new.md"), f]))
        self.assertFalse(research_only([]))
    def test_internal_exact_revision_only(self):
        repo = "owner/repo"
        pr = {"state": "open", "head": {"repo": {"full_name": repo}, "sha": "head"},
              "base": {"repo": {"full_name": repo}, "sha": "base", "ref": "main"},
              "changed_files": 1}
        verify_revision(pr, pr, repo)
        for key, val in [("sha", "new"), ("repo", {"full_name": "stranger/fork"}), ("repo", None)]:
            other = deepcopy(pr)
            other["head"][key] = val
            with self.assertRaises(ValueError):
                verify_revision(other, pr, repo)
        other = deepcopy(pr)
        other["base"]["sha"] = "newbase"
        with self.assertRaises(ValueError):
            verify_revision(other, pr, repo)
        for count in (0, 3001, None):
            other = deepcopy(pr)
            other["changed_files"] = count
            with self.assertRaises(ValueError):
                verify_revision(other, pr, repo)

class DisposableNegativeIntegrationCanary(unittest.TestCase):
    def test_intentional_release_failure_never_merge(self):
        self.fail("RELEASE-GATE-001: intentional disposable negative integration canary")

if __name__ == "__main__":
    unittest.main()
