import {Box, Button, Stack, TextField, Typography} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import {Layout} from "../src/components/layout";
import {ContentHeader} from "../src/components/content-header";
import {useRouter} from "next/router";
import {GetServerSideProps} from "next";
import {withServerSideSession} from "../src/server/with-session";
import {useState} from "react";


export const getServerSideProps: GetServerSideProps = withServerSideSession(
    async ({query, req}): Promise<{ props: WelcomeProps }> => {

        const harvestClientId = query.clientId as string ?? undefined;
        if (harvestClientId) {
            req.session.clientId = harvestClientId
            await req.session.save()
        }
        return {
            props: {
                harvestClientId: req.session.clientId ?? '',
            }
        }
    }
)

export type WelcomeProps = {
    harvestClientId?: string
}


export const Welcome = ({harvestClientId}: WelcomeProps) => {
    const router = useRouter();
    const [harvestClient, setHarvestClient] = useState(harvestClientId)

    const onClick = () => {
        router.push('https://id.getharvest.com/oauth2/authorize?client_id=' + harvestClient + '&response_type=token');
    }

    return <>
        <Layout hasAdminAccess={false} userName={''} active={'day'}>
            <Box sx={{flexGrow: 1,}}>
                <Stack spacing={2}>
                    <ContentHeader title={'Welcome'} showPicker={false}/>
                    <TextField variant={'outlined'}
                               label={'Harvest Client Id'}
                               fullWidth
                               value={harvestClient}
                               onChange={(e) => setHarvestClient(e.target.value)}/>

                    <Button color={'primary'}
                            fullWidth
                            size={'large'}
                            variant={'contained'}
                            onClick={onClick}
                    >Authenticate</Button>
                </Stack>
            </Box>
        </Layout>
    </>
        ;
}
export default Welcome;
