# Requirements for Code Review Agent

This challenge is to build your own automated code review agent that reviews every pull request against your team’s coding guidelines and posts what it finds back as a comment.

It’s relatively easy to write a script to review code with an LLM. Grab the diff, send them to a language model with a list of your team’s rules, and post the feedback as a comment. It takes an afternoon and it feels like magic. Then reality hits. The model provider rate limits you and the review silently disappears. Two people push at the same time and the bot posts three contradictory comments. Someone opens a 4,000 line pull request and the whole thing falls over. Worst of all, the bot starts confidently complaining about code that is perfectly fine, because all it can see is the diff and it has no idea what the rest of the file looks like.

In this challenge you’ll start with exactly that fragile script, and then rebuild it robustly. You’ll turn it into a declarative workflow with retries, event triggers and concurrency control. You’ll teach it to handle large pull requests, to run real static analysis tools instead of guessing, and finally to go and look things up for itself.

## Step Zero

In this introductory step you’re going to set your environment up ready to begin developing and testing your solution.

You’ll need three things before you start.

First, a GitHub personal access token with permission to read pull requests and write comments on a repository you own. Keep it somewhere safe, you’ll be using it throughout.

Second, an API key for a language model provider. Any of the big ones will do to begin with, and later in the challenge you’ll deliberately swap between several, so pick whichever is quickest for you to get started with today.

Third, and most importantly, something to review. A code reviewer is only as testable as the code you point it at, so you want a pull request where you already know what a good review would say.

I’ve put one together for you at ReviewMe. It’s a small Python checkout service, and every flaw in it is deliberate. Fork it, and you’ll find two pull requests waiting. The big one, which adds refund ratios and a reporting pack, is the one you’ll use for almost every step. It contains, on purpose:

- A live-looking Stripe key committed straight into app/config.py. Your reviewer should always catch this one.
- A rewritten calculate_discount in app/pricing.py with conditionals nested five levels deep. Your reviewer should suggest early returns.
- A new ratio = amount / order.total line in app/orders.py that looks like a division by zero waiting to happen. It isn’t, because the only caller guards against it, but that caller lives in app/checkout.py which this pull request does not touch. This one is a trap, and it matters much later.
- A regenerated uv.lock with several hundred changed lines.
- A rewritten app/report.py of around 650 lines.
- An updated test file covering the pricing changes.

The second pull request just fixes a spelling mistake in a comment. You’ll want that one in Step 4.

If you’d rather build your own, do, just create the same six issues.

You’ll also want Kestra running locally. It ships as a Docker image and the quickstart will get you to a working UI, though you won’t need it until Step 2. Alternatively it’s an open source project you can download from Kestra’s GitHub.

**Testing**: Confirm your credentials work before writing anything substantial. Fetch the pull request with a single request to https://api.github.com/repos/{owner}/{repo}/pulls/{number}/files, using your token as a bearer token. You should get back a JSON array with one entry per changed file, each containing a patch field with the diff. If you get a 401 or an empty array, fix that now rather than debugging it later through three layers of workflow.

## Step 1

In this step your goal is to build the fragile version, the one you’ll spend the rest of the challenge replacing.

Write a single script, in whatever language you like, that takes a repository owner, a repository name and a pull request number, fetches the list of changed files from the GitHub API, sends the diff to your language model along with a handful of review guidelines, and prints the review to your terminal. Read both the GitHub token and the model API key from environment variables. Don’t post anything to GitHub yet, just print it.

Keep this deliberately small. It should be well under a hundred lines. The point is not to build something good, it’s to have a working baseline and to prove your credentials and your prompt both do what you expect.

Once it runs, write down everything it doesn’t do. Mine looked like this: if the API call gets rate limited the review is simply lost, there is no record anywhere that it ran, the only way to trigger it is to run it by hand or put it on a cron job and hope, and if it produces nothing useful there is no way to find out why. Keep that list. Every remaining step in this challenge addresses one of the items on it.

**Testing**: Run your script against the refund and reporting pull request from Step Zero. You should get a review printed to your terminal that mentions the Stripe key sitting in app/config.py. If it doesn’t spot that, your prompt needs work before you go any further, because everything after this depends on the review being worth reading.

Now break it on purpose. Set your model API key to an invalid value and run it again. Notice what you get: probably a stack trace, and definitely no review.

## Step 2

In this step your goal is to get the same pull request data flowing through a workflow instead of a script.

Get Kestra running locally and create a namespace for your work. Kestra organises flows into namespaces the way a filesystem uses directories, so something like company.reviews is fine.

Now build your first flow. It should take the repository owner, the repository name and the pull request number as inputs, so you can type them into the UI and hit execute. It should fetch the pull request’s changed files, and it should log what came back. Kestra has an HTTP request task for this, and templating that lets you drop input values into a URL.

Once that works, add a second fetch for the pull request itself, at /repos/{owner}/{repo}/pulls/{number}, which gets you the title and description. The author’s own explanation of what they were trying to do are often some of the most useful context you can give a reviewer, human or otherwise.

Don’t add the model yet. This step is about getting comfortable with the shape of a flow, and about the fact that you can now see every execution, its inputs, its outputs and its logs, in a UI. That’s the first item off your Step 1 list gone.

**Testing**: Execute the flow from the UI with your fork’s owner, name and pull request number. Open the execution in the UI, click through to the task outputs, and confirm you can see the diff for each changed file and the pull request title. Execute it a second time and confirm both runs appear in the execution history with their inputs recorded.

## Step 3

In this step your goal is to turn the diff into an actual review.

Add a task that sends the diff and the pull request metadata to a language model. Kestra’s AI plugin has a chat completion task that takes a provider, a model and a list of messages, so you can point it at whichever provider you set up in Step Zero.

There are two key things here. First is the system prompt: tell the model it is an engineer reviewing a pull request, and be specific about what you want back. Ask for a Summary, an Issues Found section where every issue is tagged CRITICAL, MAJOR or MINOR, a Suggestions section, and a Verdict. Structure matters more than you’d think, because in a few steps you’ll be merging several of these together and sorting them by severity.

The second is the guidelines. Take them as a flow input rather than burying them in the prompt. Your team’s coding standards will change, and the people who want to change them are often not the people who are comfortable editing a workflow. Making the rules an input rather than part of the code is a small decision that pays off every time someone asks for a new rule.

**Testing**: Run the flow against the pull request. The review should come back in the structure you asked for, with the Stripe key tagged CRITICAL and the nesting in calculate_discount showing up as at least a MINOR issue.

Now change the guidelines input without touching the flow. Remove the rule about nesting and add one demanding that every function has a docstring. Run it again. The nesting complaint should disappear, and you should not have edited a single line of the flow to make that happen.

## Step 4

In this step your goal is to close the loop and get the review onto the pull request.

Add a final task that posts the review as a comment, using the GitHub issues comments endpoint. Pull requests are issues as far as that part of the API is concerned, so the URL is /repos/{owner}/{repo}/issues/{number}/comments.

While you’re here, stop passing your tokens around in plain sight. Kestra has a secret() function for this. One thing that catches people out: in the open source edition, secrets come from environment variables prefixed with SECRET_, and the value has to be base64 encoded. If you paste a raw token in, you’ll get a confusing failure rather than a clear one, so encode it first.

Finally, add one small piece of judgement. If the review found no issues at all, log that fact and skip posting. A bot that comments “looks good to me” on every single trivial pull request gets muted fast, and a muted bot is worth nothing.

**Testing**: Run the flow and check the pull request on GitHub. The review should be there as a comment, readable, with its headings intact.

Then test the quiet path. Run the flow against the second pull request, the one that fixes the spelling mistake in a comment. Nothing should be posted, and the execution log should tell you why it chose not to. If your reviewer manages to find a CRITICAL issue in a corrected spelling, your prompt is being far too eager and that will only get worse from here.

## Step 5

In this step your goal is to make the choice of model a detail rather than a decision.

Right now your flow is welded to one provider. Change the provider on your completion task to a different one, Anthropic or Google Gemini or OpenAI, whichever you didn’t use in Step 3, and run the same pull request through again. You’ll need a second API key, and you should not need to touch anything else in the flow. Three lines change. The fetching, the prompt, the posting and the skip logic all stay exactly as they are.

Then do something more interesting. Point it at a model running locally on your own machine via Ollama and run the review again with no outbound calls to any commercial API at all. This is the version that can run inside a bank or a defence contractor, and being able to switch to it by editing three lines is the whole argument for keeping your orchestration separate from your model.

While you’re doing all this, record the token usage and the completion task reports for each provider on the same pull request, alongside how long each one took. You now have a cost comparison based on your own code rather than someone’s pricing page.

**Testing**: Run the identical flow against the same pull request with at least three different providers, including a local model. All three should produce a usable review that catches the Stripe key.

Compare them. Note the token counts, the wall clock time, and where the reviews disagree. The local model will likely be slower and less sharp. Decide for yourself whether it’s good enough, because that’s a real decision teams have to make.

## Step 6

In this step your goal is to stop running the review by hand.

Replace manual execution with a webhook trigger, and point a GitHub webhook at it so that opening a pull request runs the review automatically. Secure the trigger with a key, otherwise anyone who finds the URL can make your workflow burn tokens on their behalf.

If you’re running Kestra locally, GitHub can’t reach you directly. A tunnelling tool such as ngrok will give you a public URL that forwards to your machine, which is fine for the length of this challenge.

Two bits of care are needed here. GitHub sends a lot of events to that webhook, so your flow should act on opened, reopened and synchronize, and quietly ignore everything else. Somebody adding a label should not trigger a code review.

The second is more subtle, and it’s the reason this step and the next are separate. synchronize fires on every single push. If someone pushes three quick fixes in a row, you’ll get three reviews running at once, all posting comments, at least two of them already out of date by the time they land. Set a concurrency limit on the flow so that only one review of a given pull request runs at a time, and choose what happens to the ones that arrive while it’s busy. Cancelling them is usually right for code review, because a review of the final state is worth more than three reviews of states nobody will ever look at again.

**Testing**: Push a new commit to the pull request and watch the execution start on its own. The comment should appear on GitHub without you touching anything.

Then try to break it. Push three commits in quick succession. You should end up with one review, not three. Check the execution list and confirm you can see the ones that were cancelled and why.

Finally, add a label to the pull request. Nothing should happen at all.

## Step 7

In this step your goal is to make the workflow survive a bad day.

Add retries to the tasks that talk to the outside world. Both the GitHub API and every model provider will rate limit you eventually, and a single 429 should not mean a lost review. Three attempts with an increasing delay between them handles the overwhelming majority of real failures.

Add a timeout to the model call. Providers occasionally accept a request and then simply never answer, and without a timeout your execution will sit there indefinitely looking like it’s working.

Then handle the case where it genuinely fails anyway. Add error handling to the flow that posts a short notice to Slack or Discord when a review fails, including the execution ID so you can go straight to the logs. This is the difference between a system you trust and a system you have to check on. Without it, a broken review looks exactly the same as a pull request nobody bothered to review, and you won’t find out for weeks.

**Testing**: Set your model API key to an invalid value and push a commit. The flow should retry, fail cleanly, and you should get a notification containing the execution ID. Follow that ID back to the logs and confirm you can see exactly what went wrong.

Restore the key and confirm normal service resumes. If you can, test the retry path properly by pointing a task at an endpoint that returns a 429 and watching the attempts in the logs with the delay growing between them.

## Step 8

In this step your goal is to handle a pull request that is too big to review in one go.

Right now you send the entire diff to the model as a single prompt. That works fine for the small pull requests you’ve been testing with and falls apart on a real one. Change your flow so that it reviews each changed file separately and in parallel, rather than concatenating everything into one enormous prompt.

That immediately raises the question of which files are worth reviewing at all. Nobody wants an AI review of a lockfile. Skip files that are generated, vendored or locked. Whatever you skip, say so in the output. A reviewer that silently ignores half the pull request is worse than no reviewer, because you’ll trust it.

Then put it back together. Merge the per file reviews into a single comment, ordered with the most severe issues first, so that a reader sees the CRITICAL finding at the top rather than four paragraphs down under a MINOR note about naming. One comment, not one per file.

**Testing**: Run it against the pull request, which has uv.lock, it should be skipped, and the comment should say so and say why. The remaining files, config.py, orders.py, pricing.py and the tests, should each have been reviewed.

Check the execution graph in the UI. You should be able to see the per file reviews running side by side rather than one after another. Compare the total time to what it took in Step 4 and note the difference.

## Step 9

In this step your goal is to stop your reviewer guessing about things a tool can simply know.

A language model asked to spot an unused import is doing an expensive impression of a linter, and it is worse at it. So run the real thing. Clone the repository at the pull request’s head commit, run a static analysis tool appropriate to the language, and capture what it finds. ReviewMe is Python and already set up for ruff, so uv run ruff check . will do it. If you built your own fixture in another language, eslint or semgrep will get you to the same place.

Run that tool inside a container rather than installing it on the machine running Kestra. Kestra’s task runners exist for exactly this: the linter, its version and its dependencies live in a Docker image, and your workflow stays clean. This also means your reviewer can handle a repository in a language nobody on your platform team has installed locally.

Then feed the findings into the review prompt, and change your instructions. Tell the model to report the tool’s findings as fact, and to spend its own commentary on the things a linter fundamentally cannot judge: whether the change matches the author’s stated intent, whether the naming makes sense, whether the approach is sound. This is the division of labour that makes automated review actually useful. Deterministic tools for deterministic problems, and the model for the judgement calls.

This is the longest step in the challenge, mostly because getting a repository checked out and a container running takes more fiddling than the rest. Give yourself a bit of time.

**Testing**: Run it against the pull request. The comment should now contain findings that are clearly attributable to the linter, reported precisely with file and line numbers, alongside softer commentary from the model.

Push a violation your linter definitely catches, an unused variable is ideal, and confirm it appears in the review with the exact line number. Then check the model isn’t taking credit for it or quietly contradicting it. If the two disagree, your prompt needs to be firmer about which one wins.

## Going Further

Once you have the core reviewer working, here are some ideas to take it further:

- Post inline comments on specific lines using GitHub’s review API, rather than one summary comment at the bottom.
- Have the reviewer reply to itself when a new commit fixes something it flagged earlier, so a pull request shows the issue being resolved rather than repeated.
- Keep a record of every review, its token cost and its verdict, and build a dashboard showing what your reviewer costs per month and which rules fire most often.
- Backfill the last fifty merged pull requests and compare your agent’s findings to the comments humans actually left. This is the honest evaluation, and it will be humbling.
- Split the workflow into a reusable subflow that any repository in your organisation can call with its own guidelines, rather than copying the flow around.
- Keep your flows in Git and deploy them through CI, so the reviewer is itself code reviewed.
- Add support for GitLab or Bitbucket by swapping the fetch and post tasks, keeping everything in between identical.
- Give teams their own namespaces and access controls, so the security team can edit review guidelines without being able to change the workflow itself.
