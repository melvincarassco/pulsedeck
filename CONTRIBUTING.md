# Contributing to PulseDeck

First off, thank you for considering contributing to PulseDeck! It's people like you that make PulseDeck such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/melvincarassco/pulsedeck/issues) to see if someone else has already created a ticket. If not, go ahead and [make one](https://github.com/melvincarassco/pulsedeck/issues/new)!

## Fork & create a branch

If this is something you think you can fix, then [fork PulseDeck](https://github.com/melvincarassco/pulsedeck/fork) and create a branch with a descriptive name.

## Get the test suite running

Make sure your local environment is set up.

1. **Frontend**:
    ```bash
    cd workflow-builder
    npm install
    npm run dev
    ```

2. **Backend**:
    ```bash
    cd workflow-api
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --port 8000 --reload
    ```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help if you get stuck.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with PulseDeck's master branch:

```bash
git remote add upstream https://github.com/melvincarassco/pulsedeck.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of main, and push it!

```bash
git checkout <branch-name>
git rebase main
git push --set-upstream origin <branch-name>
```

Finally, go to GitHub and [make a Pull Request](https://github.com/melvincarassco/pulsedeck/compare) with a clear list of what you've done.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
