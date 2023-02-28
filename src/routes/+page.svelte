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
</style>
<h1>MSW Example</h1>

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
        {JSON.stringify(loginFlow, null, 2)}
    </pre>
    <pre>
        {JSON.stringify(csrfToken, null, 2)}
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
        {JSON.stringify(accountResponse, null, 2)}
    </pre>
</div>
{/if}
