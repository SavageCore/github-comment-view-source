import { GM } from "$";

const main = async () => {
    // Get the issue number from the URL
    const username = window.location.pathname.split('/')[1];
    const repo = window.location.pathname.split('/')[2];
    const issueNumber = window.location.pathname.split('/').pop();

    const apiUrl = `https://api.github.com/repos/${username}/${repo}/issues/${issueNumber}`;

    // Define your token
    const token = await GM.getValue("githubToken", "");

    // Check if the token is available
    if (!token) {
        const createCustomDialog = () => {
            const dialog = document.createElement("div");
            dialog.innerHTML = `
        <div class="Box Box--condensed" style="position: fixed; top: 1rem; left: 50%; transform: translate(-50%); z-index: 1000;">
            <div class="Box-header">
                <h3 class="Box-title">Enter GitHub Token</h3>
            </div>
            <div class="Box-body">
                <p>Please enter your GitHub token (You can generate one <a href="https://github.com/settings/tokens/new?description=github-comment-view-source&scopes=repo,delete_repo,read:project" target="_blank">here</a>)</p>
                <input type="text" class="form-control" id="githubTokenInput" placeholder="GitHub Token">
            </div>
            <div class="Box-footer">
                <button class="btn btn-primary" id="submitToken">Submit</button>
                <button class="btn btn-secondary" id="closeButton">Close</button>
            </div>
        </div>
    `;
            document.body.appendChild(dialog);

            document.getElementById("closeButton")?.addEventListener("click", () => {
                dialog.remove();
            });

            document.getElementById("submitToken")?.addEventListener("click", async () => {
                const userToken = (document.getElementById("githubTokenInput") as HTMLInputElement)?.value;
                if (userToken) {
                    await GM.setValue("githubToken", userToken);
                    dialog.remove();
                    location.reload(); // Refresh the page
                } else {
                    showToast("You did not provide a token. Please try again.");
                }
            });
        };

        createCustomDialog();
        return;
    }

    // Fetch the issue data with Authorization header
    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    const issue = await response.json();

    // Fetch the comments data with Authorization header
    const commentsResponse = await fetch(`${apiUrl}/comments`, {
        headers: {
            'Authorization': `token ${token}`
        }
    });
    const comments = await commentsResponse.json();

    const detailsMenus = document.querySelectorAll('details-menu');
    if (detailsMenus.length > 0) {
        for (const detailsMenu of detailsMenus) {
            addSourceViewButton(detailsMenu, issue, comments);
        }
    }
}

function addSourceViewButton(detailsMenu: Element, issue: any, comments: any): void {
    // Add button to the menu
    // Example: <button type="button" class="dropdown-item btn-link js-comment-quote-reply" data-hotkey="r" role="menuitem">Quote reply</button>
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dropdown-item btn-link';
    button.innerText = 'View Source';
    // Initialize a flag to keep track of the toggle state
    let isSourceView = false;

    // Store the original content of the comment body
    let originalContent = '';

    button.onclick = async () => {
        // Find the .comment-body element directly after the current details-menu
        const timelineCommentGroup = detailsMenu.closest('.timeline-comment-group');
        const commentBody = timelineCommentGroup?.querySelector('.comment-body');
        if (commentBody) {
            // If it's the first time clicking, save the original content
            if (!originalContent) {
                originalContent = commentBody.innerHTML;
            }

            // Toggle the content based on `isSourceView`
            if (isSourceView) {
                // Switch back to the original content
                button.innerText = 'View Source';
                commentBody.innerHTML = originalContent;
            } else {
                button.innerText = 'View Original';
                const body = detectIssueOrCommentAndFetchBody(detailsMenu, issue, comments);
                const sourceCode = replaceEscapeSequences(body);

                // Replace with the source code
                commentBody.innerHTML = sourceCode;
            }

            // Toggle the flag
            isSourceView = !isSourceView;
        }
    };
    detailsMenu.appendChild(button);
}

function detectIssueOrCommentAndFetchBody(detailsMenu: Element, issue: any, comments: any[]): string {
    const timelineCommentGroup = detailsMenu.closest('.timeline-comment-group');
    const permalinkAnchor = timelineCommentGroup?.querySelector('a[id^="issue"], a[id^="issuecomment"]');

    if (permalinkAnchor) {
        const isMainIssue = permalinkAnchor.id.startsWith('issue-');
        const id = permalinkAnchor.id.split('-')[1];

        let contentBody = '';
        if (isMainIssue) {
            contentBody = issue.body;
        } else {
            // It's a comment, find the corresponding comment body
            const comment = comments.find(comment => comment.id.toString() === id);
            contentBody = comment?.body || '';
        }

        return contentBody;
    }

    return '';
}

function replaceEscapeSequences(sourceCode: string): string {
    return sourceCode
        .replace(/(?:\r\n|\r|\n)/g, '<br>') // Replace carriage returns with <br>
        .replace(/(?:\t)/g, '&nbsp;&nbsp;&nbsp;&nbsp;') // Replace tabs with four non-breaking spaces
        .replace(/(?:\f)/g, '<br>') // Form feed, treated as a new line in HTML
        .replace(/(?:\v)/g, '<br>'); // Vertical tab, treated as a new line in HTML
}

const showToast = (message: string, timeout = 5000) => {
    const dialog = document.createElement("div");
    dialog.innerHTML = `
        <div class="Box Box--condensed" style="position: fixed; top: 1rem; left: 50%; transform: translate(-50%); z-index: 1000;">
            <div class="Box-header">
                <h3 class="Box-title">github-comment-view-source</h3>
            </div>
            <div class="Box-body">
                <p>${message}</p>
            </div>
            <div class="Box-footer">
                <button class="btn btn-secondary" id="closeButton">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    document.getElementById("closeButton")?.addEventListener("click", () => {
        dialog.remove();
    });

    // Automatically remove the toast after 5 seconds
    setTimeout(() => {
        document.body.removeChild(dialog);
    }, timeout);
};

main();