import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  Tabs, 
  Tab,
  Divider,
  Modal,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';

// 样式化组件
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  },
}));

const InfoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
  },
}));

const educationalContent = [
  {
    id: 'basics',
    title: 'What is the Air Quality Index (AQI)?',
    content: 'The Air Quality Index (AQI) is a standard for measuring the level of air pollution. PM2.5 refers to particulate matter with a diameter of less than 2.5 microns, which can penetrate deep into the lungs and enter the bloodstream. For asthma patients, high concentrations of PM2.5 can irritate the respiratory tract, triggering or worsening asthma symptoms.',
    videoLink: 'https://www.youtube.com/embed/rn9eUIbqCPU',
  },
  {
    id: 'triggers',
    title: 'Asthma Symptom Self-Check',
    content: 'Dry cough, sleep disturbances, frequent yawning and sighing, heartburn, and fatigue are some symptoms of asthma. If you experience these symptoms, seek medical attention promptly.',
    videoLink: 'https://www.youtube.com/embed/LL5KblmjuK4',
  },
  {
    id: 'emergency',
    title: 'Asthma First Aid',
    content: 'When a child shows asthma symptoms, stay calm, have them sit upright, and use prescribed rescue medication, such as a short-acting bronchodilator. If symptoms persist or worsen, seek medical attention immediately.',
    videoLink: 'https://www.youtube.com/embed/1dV2vFAcqIw',
  },
];

const preventiveMeasures = [
  {
    title: 'Indoor Air Quality Management',
    steps: [
      'Use an air purifier with HEPA filter',
      'Maintain proper indoor humidity (40-50%)',
      'Regularly clean air conditioning and ventilation systems',
      'Avoid using harsh cleaning products',
      'No indoor smoking'
    ]
  },
  {
    title: 'Outdoor Activity Adjustments',
    steps: [
      'Monitor daily air quality forecasts',
      'Reduce outdoor activities when AQI > 100',
      'Schedule outdoor activities during times with better air quality (e.g., early morning)',
      'Avoid areas with heavy traffic',
      'Wash hands and face after outdoor activities'
    ]
  },
  {
    title: 'Medication Management',
    steps: [
      'Take prescribed controller medications as directed',
      'Keep rescue medications readily available',
      'Know the proper usage of your medications',
      'Regularly visit your doctor to assess asthma control',
      'Have a written asthma action plan'
    ]
  },
  {
    title: 'Lifestyle Adjustments',
    steps: [
      'Maintain a regular sleep schedule and get enough sleep',
      'Eat a balanced diet to boost immunity',
      'Engage in breathing exercises and physical activity appropriately',
      'Minimize exposure to allergens such as pet dander',
      'Keep a stable mood and avoid drastic emotional fluctuations'
    ]
  },
];

// 自测问卷数据
const quizQuestions = [
  {
    question: 'Which of the following is NOT an indicator for assessing air quality?',
    options: ['PM2.5', 'AQI', 'BMI', 'O3'],
    correctAnswer: 'BMI',
    explanation: 'BMI (Body Mass Index) is an indicator for assessing weight, not air quality. PM2.5, AQI, and O3 (Ozone) are all indicators used to assess air quality.'
  },
  {
    question: 'At what AQI level should children with asthma avoid outdoor activities?',
    options: ['50', '100', '150', '200'],
    correctAnswer: '100',
    explanation: 'An AQI above 100 indicates that air quality is unhealthy for sensitive groups. Children with asthma should reduce outdoor activities.'
  },
  {
    question: 'Which of the following measures does NOT help improve indoor air quality?',
    options: ['Using an air purifier', 'Opening windows for ventilation', 'Using a humidifier', 'Lighting scented candles'],
    correctAnswer: 'Lighting scented candles',
    explanation: 'Burning scented candles releases volatile organic compounds (VOCs), which may irritate the respiratory tract and worsen asthma symptoms.'
  },
  {
    question: 'Under what weather conditions do air pollutants tend to accumulate more easily?',
    options: ['Rainy days', 'Windy days', 'Clear and windless days', 'Snowy days'],
    correctAnswer: 'Clear and windless days',
    explanation: 'Under clear and windless weather conditions, air circulation is poor, making it easier for pollutants to accumulate and form smog.'
  },
  {
    question: 'When a child has an asthma attack, which of the following actions is incorrect?',
    options: ['Have the child sit upright', 'Use prescribed rescue medication', 'Give the child a large amount of water', 'Stay calm'],
    correctAnswer: 'Give the child a large amount of water',
    explanation: 'During an asthma attack, giving a child a large amount of water may increase the risk of choking. The child should be kept upright and given prescribed rescue medication.'
  },
];

function EducationalInsights() {
  const [tabValue, setTabValue] = useState(0);
  const [preventiveTabValue, setPreventiveTabValue] = useState(0); // 新增预防措施选项卡状态
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false); // 新增奖励弹窗状态

  // 处理标签页变化
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理预防措施选项卡变化
  const handlePreventiveTabChange = (event, newValue) => {
    setPreventiveTabValue(newValue);
  };

  // 处理问卷答案选择
  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  // 提交问卷
  const handleQuizSubmit = () => {
    setShowQuizResults(true);
    // 检查是否所有问题都回答正确
    const score = calculateQuizScore();
    if (score.score === score.total) {
      setShowRewardModal(true);
    }
  };

  // 重置问卷
  const handleQuizReset = () => {
    setQuizAnswers({});
    setShowQuizResults(false);
    setShowRewardModal(false); // 重置时关闭奖励弹窗
  };

  // 关闭奖励弹窗
  const handleCloseRewardModal = () => {
    setShowRewardModal(false);
  };

  // 计算问卷得分
  const calculateQuizScore = () => {
    let correctCount = 0;
    quizQuestions.forEach((q, index) => {
      if (quizAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });
    return {
      score: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100)
    };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4, fontWeight: 700 }}>
        Air Quality and Asthma Education Platform
      </Typography>

      {/* 教育内容标签页 */}
      <Box sx={{ mb: 6 }}>
        <StyledPaper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="educational content tabs">
              <Tab label="Educational Content" id="tab-0" />
              <Tab label="Precautionary Measures" id="tab-1" />
              <Tab label="Self-test Questionnaire" id="tab-2" />
            </Tabs>
          </Box>
          
          {/* 教育内容 */}
          {tabValue === 0 && (
            <Box>
              <Grid container spacing={4}>
                {educationalContent.map((content) => (
                  <Grid item xs={12} key={content.id}>
                    <InfoCard>
                      {content.image && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={content.image}
                          alt={content.title}
                        />
                      )}
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                          {content.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {content.content}
                        </Typography>
                        {content.videoLink && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                              Relative Video:
                            </Typography>
                            <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', mb: 1 }}>
                              <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                src={content.videoLink}
                                title={content.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </Box>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              href={content.videoLink.replace('embed/', 'watch?v=')} 
                              target="_blank"
                              sx={{ mt: 1 }}
                            >
                              Watch on YouTube
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </InfoCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* 预防措施 */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h5" component="h3" gutterBottom sx={{ mb: 3 }}>
                Precautionary Measures for Asthma Patients
              </Typography>
              
              {/* 预防措施选项卡 */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={preventiveTabValue} 
                  onChange={handlePreventiveTabChange} 
                  aria-label="preventive measures tabs"
                  variant="fullWidth"
                  sx={{ mb: 2 }}
                >
                  {preventiveMeasures.map((measure, index) => (
                    <Tab label={measure.title} id={`preventive-tab-${index}`} key={index} />
                  ))}
                </Tabs>
              </Box>
              
              {/* 预防措施内容 */}
              {preventiveMeasures.map((measure, index) => (
                preventiveTabValue === index && (
                  <StyledPaper key={index}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {measure.title}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box component="ul" sx={{ pl: 2 }}>
                      {measure.steps.map((step, stepIndex) => (
                        <Box component="li" key={stepIndex} sx={{ mb: 1 }}>
                          <Typography variant="body1">{step}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </StyledPaper>
                )
              ))}
            </Box>
          )}
          
          {/* 自测问卷 */}
          {tabValue === 2 && (
            <Box>
              {showQuizResults ? (
                <Box>
                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h5" component="h3" gutterBottom>
                      Test Results
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: 'primary.main', mb: 2 }}>
                      {calculateQuizScore().score}/{calculateQuizScore().total} ({calculateQuizScore().percentage}%)
                    </Typography>
                    <Button variant="contained" onClick={handleQuizReset}>
                      Test Again
                    </Button>
                  </Box>
                  
                  <Box>
                    {quizQuestions.map((q, index) => (
                      <StyledPaper key={index} sx={{ mb: 3 }}>
                        <Typography variant="h6" component="h4" gutterBottom>
                          {index + 1}. {q.question}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {q.options.map((option) => (
                            <Box key={option} sx={{ 
                              p: 1, 
                              mb: 1, 
                              borderRadius: 1,
                              bgcolor: option === q.correctAnswer 
                                ? 'success.light' 
                                : (quizAnswers[index] === option && option !== q.correctAnswer) 
                                  ? 'error.light' 
                                  : 'grey.100'
                            }}>
                              <Typography variant="body1">
                                {option} {option === q.correctAnswer && '✓'}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>Explanation:</strong> {q.explanation}
                          </Typography>
                        </Box>
                      </StyledPaper>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ mb: 3 }}>
                    Test your knowledge of air quality and asthma
                  </Typography>
                  
                  {quizQuestions.map((q, index) => (
                    <StyledPaper key={index} sx={{ mb: 3 }}>
                      <Typography variant="h6" component="h4" gutterBottom>
                        {index + 1}. {q.question}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {q.options.map((option) => (
                          <Box 
                            key={option} 
                            onClick={() => handleQuizAnswer(index, option)}
                            sx={{ 
                              p: 1, 
                              mb: 1, 
                              borderRadius: 1,
                              bgcolor: quizAnswers[index] === option ? 'primary.light' : 'grey.100',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'primary.light',
                                opacity: 0.8
                              }
                            }}
                          >
                            <Typography variant="body1">{option}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </StyledPaper>
                  ))}
                  
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                    >
                      Submit Answer
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </StyledPaper>
      </Box>
      
      {/* 底部信息 */}
      <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
        <Typography variant="body2">
          © 2025 Air Quality and Asthma Education Platform | Data for Educational Purposes Only
        </Typography>
      </Box>
      
      {/* 奖励弹窗 */}
      <Modal
        open={showRewardModal}
        onClose={handleCloseRewardModal}
        aria-labelledby="reward-modal-title"
        aria-describedby="reward-modal-description"
        closeAfterTransition
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Fade in={showRewardModal}>
          <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            maxWidth: 400,
            textAlign: 'center',
            position: 'relative',
            outline: 'none',
          }}>
            <Typography id="reward-modal-title" variant="h4" component="h2" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
              Bingo! Congratulations!
            </Typography>
            <Typography id="reward-modal-description" variant="body1" sx={{ mb: 3 }}>
              You've answered all questions correctly! Great job on mastering the knowledge about air quality and asthma management.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="contained" onClick={handleCloseRewardModal}>
                Close
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}

export default EducationalInsights;
