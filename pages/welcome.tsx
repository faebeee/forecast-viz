import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import { Layout } from "../src/components/layout";
import { ContentHeader } from "../src/components/content-header";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { withServerSideSession } from "../src/server/with-session";
import { useState } from "react";
import Image from "next/image";


export const getServerSideProps: GetServerSideProps = withServerSideSession(
    async ({ query, req }): Promise<{ props: WelcomeProps }> => {

        const harvestClientId = query.clientId as string ?? undefined;
        if (harvestClientId) {
            req.session.clientId = harvestClientId
            await req.session.save()
        }
        return {
            props: {
                harvestClientId: req.session.clientId ?? process.env.HARVEST_CLIENT_ID,
            }
        }
    }
)

export type WelcomeProps = {
    harvestClientId?: string
}


export const Welcome = ({ harvestClientId }: WelcomeProps) => {
    const router = useRouter();
    const [ harvestClient, setHarvestClient ] = useState(harvestClientId)

    const onClick = () => {
        router.push('https://id.getharvest.com/oauth2/authorize?client_id=' + harvestClient + '&response_type=token');
    }

    return <>
        <Layout hasAdminAccess={ false } userName={ '' } active={ 'day' } hideDrawer>
            <Container maxWidth="sm" sx={ { flexGrow: 1, } }>
                <Stack spacing={ 4 }>
                    <Typography align={ "center" } variant={ 'h2' }>Welcome</Typography>
                    <Image src={ '/illu/connect.svg' } width={ 192 } height={ 192 }/>
                    <Typography align={ "center" } variant={ 'body1' }>Not logged in and connected to Forecast and
                        Harvest. Please login in order to connect and use forecast-viz</Typography>

                    <TextField variant={ 'outlined' }
                        disabled
                        label={ 'Harvest Client Id' }
                        fullWidth
                        value={ harvestClient }
                        onChange={ (e) => setHarvestClient(e.target.value) }/>

                    <Button color={ 'primary' }
                        fullWidth
                        size={ 'large' }
                        variant={ 'contained' }
                        onClick={ onClick }
                    >Login</Button>
                </Stack>
            </Container>
        </Layout>
    </>
        ;
}
export default Welcome;
