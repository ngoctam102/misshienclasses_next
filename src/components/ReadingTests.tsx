import Link from "next/link";
import { 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    Box,
    Chip,
    CardActions
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';

interface TestListItem {
    test_slug: string;
    title: string;
    level: string;
    duration: number;
    type: string;
}

export default function ReadingTests({ tests }: { tests: TestListItem[] }) {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)'
                },
                gap: { xs: 1, sm: 2 },
                maxWidth: '1200px',
                margin: '0 auto',
                height: '100%',
                padding: { xs: 1, sm: 2 }
            }}>
                {tests.map((test) => (
                    <Box key={test.test_slug}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 300ms ease-in-out',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: 3
                                }
                            }}
                        >
                            <CardContent sx={{ 
                                flexGrow: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                p: 1.5,
                                '&:last-child': {
                                    pb: 1.5
                                }
                            }}>
                                <Typography 
                                    variant="subtitle1" 
                                    component="h2" 
                                    gutterBottom
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        minHeight: '2.8em',
                                        lineHeight: '1.2em',
                                        transition: 'all 300ms ease-in-out'
                                    }}
                                >
                                    {test.title}
                                </Typography>
                                <Box display="flex" gap={1} mb={1} sx={{ transition: 'all 300ms ease-in-out' }}>
                                    <Chip 
                                        icon={<SchoolIcon />} 
                                        label={test.level} 
                                        color="primary" 
                                        size="small"
                                        sx={{ transition: 'all 300ms ease-in-out' }}
                                    />
                                    <Chip 
                                        icon={<AccessTimeIcon />} 
                                        label={`${test.duration} minutes`} 
                                        color="secondary" 
                                        size="small"
                                        sx={{ transition: 'all 300ms ease-in-out' }}
                                    />
                                </Box>
                            </CardContent>
                            <CardActions sx={{ p: 1.5, pt: 0, transition: 'all 300ms ease-in-out' }}>
                                <Button
                                    component={Link}
                                    href={`/reading/start/${test.test_slug}`}
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="small"
                                    sx={{ 
                                        transition: 'all 300ms ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 2
                                        }
                                    }}
                                >
                                    Start test
                                </Button>
                            </CardActions>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
