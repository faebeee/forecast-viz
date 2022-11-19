import {Box, Button, Stack, TextField, Typography} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import {Layout} from "../src/components/layout";
import {ContentHeader} from "../src/components/content-header";
import {useRouter} from "next/router";
import {GetServerSideProps} from "next";
import {withServerSideSession} from "../src/server/with-session";


export const getServerSideProps: GetServerSideProps = withServerSideSession(
    async ({query, req}): Promise<{ props: WelcomeProps }> => {
        const harvestClientId = query.clientId as string ?? '';
        return {
            props: {
                harvestClientId,
            }
        }
    }
)

export type WelcomeProps = {
    harvestClientId:string
}


export const Welcome = ({harvestClientId}: WelcomeProps) => {
    const router = useRouter();

    const onClick = () => {
        router.push('https://id.getharvest.com/oauth2/authorize?client_id=' + harvestClientId + '&response_type=token');
    }

    return <>
        <Layout hasAdminAccess={false} userName={''} active={'day'}>
            <Box sx={{flexGrow: 1,}}>
                <Stack spacing={2}>
                    <Typography variant={'h4'}>Settings</Typography>
                    <TextField variant={'outlined'}
                               label={'Harvest Client Id'}
                               fullWidth
                               value={harvestClientId}
                    />

                </Stack>

                <Box p={4}>
                    <ContentHeader title={'Welcome'} showPicker={false}/>
                    <Button color={'primary'}
                            fullWidth
                            size={'large'}
                            variant={'contained'}
                            onClick={onClick}
                    >Authenticate</Button>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Welcome;
