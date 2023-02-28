<script>
    import {Configuration, FrontendApi} from '@ory/client'
  import { onMount } from 'svelte';

    const config = new Configuration({
        basePath: 'http://localhost:4000',
        baseOptions: {
            withCredentials: true,
        },
    })

    const ory = {
        frontend: new FrontendApi(config),
    }

    /** @type {import('@ory/client').LoginFlow} */
    let loginFlow

    /** @type {import('@ory/client').UiNodeInputAttributes} */
    let csrfToken

    /** @type {import('@ory/client').SuccessfulNativeRegistration}*/
    let accountResponse

    /** @type {Array<string>} */
    let errorMsg = []

    /** @type {boolean} */
    let loginStatusIndicator = false

    /**
     * @param {any} val
     * @returns {string}
     */
    function prettyJson(val) {
        return JSON.stringify(val, null, 2)
    }

    /**
     * @returns {Promise<Object>}
     */
    async function mockBin() {
        const response = await fetch(
            "http://mockbin.com/request?foo=bar&foo=baz",
            {
                "method": "POST",
                "headers": {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "cookie": "foo=bar; bar=baz",
                    "x-pretty-print": "2"
                },
                "body": JSON.stringify({
                    "foo": "bar"
                }),
            })
        if (response.ok) {
            return response.json()
        }
        console.error(response)
        return {
            error: true,
            msg: response.text(),
        }
    }

    function generatePassword() {
        return '10823Till##'
    }

    async function loginStatus() {
        try {
            await ory.frontend.toSession()
            return true
        } catch(ex) {
            console.error(ex)
            return false
        }

    }

    async function getLogoutLink() {
        const response = await ory.frontend.createBrowserLogoutFlow()
        return response.data.logout_url
    }

    async function createFlow() {
        loginFlow = await ory.
            frontend.
            createBrowserRegistrationFlow().
            then(({data: flow}) => flow)

        loginFlow.ui.nodes.forEach((node) => {
            if (node.group == 'default') {
                if (node.attributes.name == 'csrf_token') {
                    csrfToken = node.attributes
                } 
            }
        })
    }

    async function submitFlow() {
        /** @type {HTMLInputElement|null} */
        const email = document.querySelector('[name="email"]')

        if (email) {
            console.log(email.value)
        } else {
            errorMsg = [...errorMsg, 'Empty email!']
            return
        }

        try {
            const response = await ory.frontend.updateRegistrationFlow({
                flow: loginFlow.id,
                updateRegistrationFlowBody: {
                    method: 'password',
                    password: generatePassword(),
                    traits: {
                        email: email.value,
                    },
                    csrf_token: csrfToken.value,
                },
            })
           accountResponse = response.data
           loginStatusIndicator = true
        } catch (ex) {
            // FIXME: proper typing
            const data = await ex.response.data
            console.log('data: ', data)
            console.log('response: ', ex.response)

            if (data.ui.messages.length == 0) {
                errorMsg = [...errorMsg, 'Response failed: ' + ex.response.status]
                return
            }

            data.ui.messages.forEach(msg => {
                if (msg.type != 'error') {
                    return
                }
                errorMsg = [...errorMsg, msg.text]
            })
        }
    }

    onMount(async() => {
        loginStatusIndicator = await loginStatus()
    })
</script>
<style type="text/css">
pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: 6pt;
}
.error {
    color: crimson;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10pt;
}
.container {
    display: flex;
}
.container div {
    flex: 1;
    padding: 10px;
    border: 2px solid green;
}
</style>
<h1>MSW Example</h1>

<div class="container">
    <div>
    {#if loginStatusIndicator}
        You are logged in!
        {#await getLogoutLink()}
            ... getting a link
        {:then link}
            [<a href="{link}">log out</a>]
        {/await}
    {:else}
        Not logged in! Create an account? 👇
    {/if}

    {#if !loginStatusIndicator && !loginFlow}
        <div>
            <h2>Step 0/1: Let's get a flow!</h2>
            <button on:click={createFlow}>Initialize flow</button>
        </div>
    {/if}

    {#if loginFlow && !accountResponse}
        <div>
            <h2>Step 1/1: Here's the flow</h2>
            <pre>
                {prettyJson(loginFlow)}
            </pre>
            <pre>
                {prettyJson(csrfToken)}
            </pre>
        </div>

        <div>
            <h2>Step 2/1: Let's create a user account</h2>
            <form on:submit|preventDefault={submitFlow}>
                <input type="text" placeholder="email" name="email">
                <input type="submit" value="create account">
            </form>

            {#if errorMsg.length > 0}
                <h3>Errors</h3>
                <ul>
                {#each errorMsg as msg}
                    <li class="error">{msg}</li>
                {/each}
                </ul>
            {/if}
        </div>
    {/if}

    {#if accountResponse}
        <div>
            <h2>Step 2/2 (Done): You are now logged in!</h2>
            <p>
                <a href="/" rel="external">Reload!</a>
            </p>
            <pre>
                {prettyJson(accountResponse)}
            </pre>
        </div>
    {/if}
    </div>
    <div>
        <h2>async request</h2>
        <div>
        {#await mockBin()}
            ... loading mockbin
        {:then response}
            <h3>headers</h3>
            <pre>
                {prettyJson(response.headers)}
            </pre>
            <h3>postData</h3>
            <pre>
                {prettyJson(response.postData)}
            </pre>
        {:catch exception}
            An error occurred (DNS, network?):
            <pre class="error">
                {exception}
            </pre>
        {/await}
        </div>
    </div>
</div>
